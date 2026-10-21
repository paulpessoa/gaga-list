import { supabaseServerClient as db } from "@/lib/supabase/server"
import { estimateApiCost, estimateRechargeRevenue } from "./costs"

/**
 * Métricas do painel admin.
 *
 * COMO FUNCIONA: roda só no servidor com a SERVICE_ROLE_KEY (ignora RLS), por isso
 * só é chamado depois de `requireAdmin()`. Não depende de nenhuma migration nova:
 * lê as tabelas que já existem e agrega em memória.
 *
 * LIMITE CONHECIDO: agregar em JS é ótimo até dezenas de milhares de linhas.
 * Quando passar disso, troque por funções SQL (ver docs/admin/README.md →
 * "Escalando as métricas").
 */

const PAGE = 1000 // limite padrão de linhas por request do PostgREST

/** Busca todas as linhas de uma query paginando de 1000 em 1000. */
async function fetchAll<T>(
  build: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>
): Promise<T[]> {
  const rows: T[] = []
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await build(from, from + PAGE - 1)
    if (error) throw error
    rows.push(...(data ?? []))
    if (!data || data.length < PAGE) break
  }
  return rows
}

async function count(table: "profiles" | "lists" | "items" | "list_collaborators" | "global_products" | "my_products", filter?: (q: any) => any) {
  let q: any = db.from(table).select("*", { count: "exact", head: true })
  if (filter) q = filter(q)
  const { count: c, error } = await q
  if (error) throw error
  return c ?? 0
}

export function daysAgo(days: number) {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - days + 1)
  return d
}

/** Chave de dia local (YYYY-MM-DD) para montar séries temporais. */
function dayKey(iso: string | Date) {
  const d = typeof iso === "string" ? new Date(iso) : iso
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function emptySeries(days: number) {
  const start = daysAgo(days)
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(start)
    d.setDate(start.getDate() + i)
    return dayKey(d)
  })
}

export interface DailyPoint {
  day: string
  value: number
}

export interface OverviewMetrics {
  periodDays: number
  users: { total: number; newInPeriod: number; newPrevPeriod: number; active7d: number; activeInPeriod: number; pushEnabled: number }
  lists: { active: number; createdInPeriod: number; shared: number; inTrash: number }
  items: { total: number; addedInPeriod: number; purchasedInPeriod: number }
  ai: { calls: number; grainsSpent: number; estimatedCost: number; payingUsers: number; revenue: number; creditsInCirculation: number }
  catalog: { globalProducts: number; pendingCuration: number }
  series: { signups: DailyPoint[]; activeUsers: DailyPoint[]; itemsAdded: DailyPoint[] }
  aiByFeature: { feature: string; calls: number; grains: number; cost: number }[]
}

export async function getOverviewMetrics(periodDays = 30): Promise<OverviewMetrics> {
  const since = daysAgo(periodDays).toISOString()
  const prevSince = daysAgo(periodDays * 2).toISOString()
  const since7d = daysAgo(7).toISOString()

  const [
    totalUsers,
    newInPeriod,
    newPrevPeriod,
    pushEnabled,
    activeLists,
    listsInPeriod,
    inTrash,
    totalItems,
    globalProducts,
    pendingCuration,
    signupRows,
    itemRows,
    checkedRows,
    aiRows,
    listRows,
    messageRows,
    collabRows,
    creditRows
  ] = await Promise.all([
    count("profiles"),
    count("profiles", (q) => q.gte("created_at", since)),
    count("profiles", (q) => q.gte("created_at", prevSince).lt("created_at", since)),
    count("profiles", (q) => q.not("push_subscription", "is", null)),
    count("lists", (q) => q.is("deleted_at", null)),
    count("lists", (q) => q.gte("created_at", since)),
    count("lists", (q) => q.not("deleted_at", "is", null)),
    count("items"),
    count("global_products"),
    count("my_products"),
    fetchAll<{ created_at: string }>((f, t) =>
      db.from("profiles").select("created_at").gte("created_at", since).range(f, t)
    ),
    fetchAll<{ created_at: string; added_by: string | null }>((f, t) =>
      db.from("items").select("created_at, added_by").gte("created_at", since).range(f, t)
    ),
    fetchAll<{ checked_at: string | null; checked_by: string | null }>((f, t) =>
      db.from("items").select("checked_at, checked_by").gte("checked_at", since).range(f, t)
    ),
    fetchAll<{ created_at: string; user_id: string | null; feature: string; cost: number }>((f, t) =>
      db.from("ai_usage_logs").select("created_at, user_id, feature, cost").gte("created_at", since).range(f, t)
    ),
    fetchAll<{ created_at: string; owner_id: string }>((f, t) =>
      db.from("lists").select("created_at, owner_id").gte("created_at", since).range(f, t)
    ),
    fetchAll<{ created_at: string; user_id: string }>((f, t) =>
      db.from("list_messages").select("created_at, user_id").gte("created_at", since).range(f, t)
    ),
    fetchAll<{ list_id: string }>((f, t) => db.from("list_collaborators").select("list_id").range(f, t)),
    fetchAll<{ credits: number | null }>((f, t) => db.from("profiles").select("credits").range(f, t))
  ])

  // "Usuário ativo" = fez qualquer ação registrada no banco no dia:
  // adicionou/marcou item, criou lista, mandou mensagem ou usou IA.
  // PORQUÊ: ainda não existe profiles.last_seen_at (ver migration opcional).
  const activity: { at: string; user: string | null }[] = [
    ...itemRows.map((r) => ({ at: r.created_at, user: r.added_by })),
    ...checkedRows.map((r) => ({ at: r.checked_at!, user: r.checked_by })),
    ...aiRows.map((r) => ({ at: r.created_at, user: r.user_id })),
    ...listRows.map((r) => ({ at: r.created_at, user: r.owner_id })),
    ...messageRows.map((r) => ({ at: r.created_at, user: r.user_id }))
  ]

  const days = emptySeries(periodDays)
  const activeByDay = new Map<string, Set<string>>(days.map((d) => [d, new Set()]))
  const activeInPeriod = new Set<string>()
  const active7d = new Set<string>()
  for (const a of activity) {
    if (!a.user || !a.at) continue
    activeByDay.get(dayKey(a.at))?.add(a.user)
    activeInPeriod.add(a.user)
    if (a.at >= since7d) active7d.add(a.user)
  }

  const countByDay = (rows: string[]) => {
    const m = new Map<string, number>(days.map((d) => [d, 0]))
    for (const iso of rows) {
      const k = dayKey(iso)
      if (m.has(k)) m.set(k, m.get(k)! + 1)
    }
    return days.map((day) => ({ day, value: m.get(day)! }))
  }

  // IA: cost > 0 = consumo de grãos; cost < 0 = recarga paga (Stripe)
  let grainsSpent = 0
  let estimatedCost = 0
  let revenue = 0
  let calls = 0
  const payingUsers = new Set<string>()
  const byFeature = new Map<string, { calls: number; grains: number; cost: number }>()
  for (const log of aiRows) {
    if (log.cost < 0) {
      revenue += estimateRechargeRevenue(Math.abs(log.cost))
      if (log.user_id) payingUsers.add(log.user_id)
      continue
    }
    calls++
    grainsSpent += log.cost
    const c = estimateApiCost(log.feature)
    estimatedCost += c
    const f = byFeature.get(log.feature) ?? { calls: 0, grains: 0, cost: 0 }
    f.calls++
    f.grains += log.cost
    f.cost += c
    byFeature.set(log.feature, f)
  }

  return {
    periodDays,
    users: {
      total: totalUsers,
      newInPeriod,
      newPrevPeriod,
      active7d: active7d.size,
      activeInPeriod: activeInPeriod.size,
      pushEnabled
    },
    lists: {
      active: activeLists,
      createdInPeriod: listsInPeriod,
      shared: new Set(collabRows.map((c) => c.list_id)).size,
      inTrash
    },
    items: {
      total: totalItems,
      addedInPeriod: itemRows.length,
      purchasedInPeriod: checkedRows.length
    },
    ai: {
      calls,
      grainsSpent,
      estimatedCost,
      payingUsers: payingUsers.size,
      revenue,
      creditsInCirculation: creditRows.reduce((s, r) => s + (r.credits ?? 0), 0)
    },
    catalog: { globalProducts, pendingCuration },
    series: {
      signups: countByDay(signupRows.map((r) => r.created_at)),
      activeUsers: days.map((day) => ({ day, value: activeByDay.get(day)!.size })),
      itemsAdded: countByDay(itemRows.map((r) => r.created_at))
    },
    aiByFeature: [...byFeature.entries()]
      .map(([feature, v]) => ({ feature, ...v }))
      .sort((a, b) => b.calls - a.calls)
  }
}

export interface AdminUserRow {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  created_at: string
  credits: number | null
  is_admin: boolean | null
  push: boolean
  listsOwned: number
  aiCalls: number
  lastActivity: string | null
}

/** Lista paginada de usuários com contadores básicos de engajamento. */
export async function getUsers({ q = "", page = 1, perPage = 25 }: { q?: string; page?: number; perPage?: number }) {
  let query = db
    .from("profiles")
    .select("id, full_name, email, avatar_url, created_at, credits, is_admin, push_subscription", { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * perPage, page * perPage - 1)

  const term = q.trim().replace(/[%,()]/g, "")
  if (term) query = query.or(`email.ilike.%${term}%,full_name.ilike.%${term}%`)

  const { data: profiles, count: total, error } = await query
  if (error) throw error
  const ids = (profiles ?? []).map((p) => p.id)
  if (ids.length === 0) return { rows: [] as AdminUserRow[], total: total ?? 0, page, perPage }

  const [lists, logs, items] = await Promise.all([
    fetchAll<{ owner_id: string; updated_at: string }>((f, t) =>
      db.from("lists").select("owner_id, updated_at").in("owner_id", ids).is("deleted_at", null).range(f, t)
    ),
    fetchAll<{ user_id: string | null; created_at: string; cost: number }>((f, t) =>
      db.from("ai_usage_logs").select("user_id, created_at, cost").in("user_id", ids).range(f, t)
    ),
    fetchAll<{ added_by: string | null; created_at: string }>((f, t) =>
      db.from("items").select("added_by, created_at").in("added_by", ids).order("created_at", { ascending: false }).range(f, t)
    )
  ])

  const latest = new Map<string, string>()
  const bump = (id: string | null, at: string) => {
    if (!id) return
    const cur = latest.get(id)
    if (!cur || at > cur) latest.set(id, at)
  }
  lists.forEach((l) => bump(l.owner_id, l.updated_at))
  logs.forEach((l) => bump(l.user_id, l.created_at))
  items.forEach((i) => bump(i.added_by, i.created_at))

  const rows: AdminUserRow[] = (profiles ?? []).map((p) => ({
    id: p.id,
    full_name: p.full_name,
    email: p.email,
    avatar_url: p.avatar_url,
    created_at: p.created_at,
    credits: p.credits,
    is_admin: p.is_admin,
    push: !!p.push_subscription,
    listsOwned: lists.filter((l) => l.owner_id === p.id).length,
    aiCalls: logs.filter((l) => l.user_id === p.id && l.cost > 0).length,
    lastActivity: latest.get(p.id) ?? null
  }))

  return { rows, total: total ?? 0, page, perPage }
}

export interface AiLogRow {
  id: string
  created_at: string
  feature: string
  cost: number
  model_used: string | null
  user: { full_name: string | null; email: string } | null
}

/** Uso de IA no período: por feature, por modelo e últimos registros. */
export async function getAiUsage(periodDays = 30) {
  const since = daysAgo(periodDays).toISOString()
  const logs = await fetchAll<{ user_id: string | null; feature: string; cost: number; model_used: string | null; created_at: string }>(
    (f, t) => db.from("ai_usage_logs").select("user_id, feature, cost, model_used, created_at").gte("created_at", since).range(f, t)
  )

  const byFeature = new Map<string, { calls: number; grains: number; cost: number; users: Set<string> }>()
  const byModel = new Map<string, number>()
  const days = emptySeries(periodDays)
  const callsByDay = new Map<string, number>(days.map((d) => [d, 0]))

  for (const l of logs) {
    if (l.cost < 0) continue
    const f = byFeature.get(l.feature) ?? { calls: 0, grains: 0, cost: 0, users: new Set<string>() }
    f.calls++
    f.grains += l.cost
    f.cost += estimateApiCost(l.feature)
    if (l.user_id) f.users.add(l.user_id)
    byFeature.set(l.feature, f)
    const model = l.model_used || "desconhecido"
    byModel.set(model, (byModel.get(model) ?? 0) + 1)
    const k = dayKey(l.created_at)
    if (callsByDay.has(k)) callsByDay.set(k, callsByDay.get(k)! + 1)
  }

  const { data: recent, error } = await db
    .from("ai_usage_logs")
    .select("id, created_at, feature, cost, model_used, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50)
  if (error) throw error

  return {
    periodDays,
    features: [...byFeature.entries()]
      .map(([feature, v]) => ({ feature, calls: v.calls, grains: v.grains, cost: v.cost, users: v.users.size }))
      .sort((a, b) => b.calls - a.calls),
    models: [...byModel.entries()].map(([model, calls]) => ({ model, calls })).sort((a, b) => b.calls - a.calls),
    callsByDay: days.map((day) => ({ day, value: callsByDay.get(day)! })),
    recent: (recent ?? []).map((r: any) => ({
      id: r.id,
      created_at: r.created_at,
      feature: r.feature,
      cost: r.cost,
      model_used: r.model_used,
      user: r.profiles ?? null
    })) as AiLogRow[]
  }
}

/** Valores de configuração gravados no banco (system_settings). */
export async function getStoredSettings() {
  const { data, error } = await db.from("system_settings" as any).select("key, value, updated_at")
  if (error) return []
  return (data ?? []) as unknown as { key: string; value: unknown; updated_at: string | null }[]
}

export function parsePeriod(value: string | string[] | undefined) {
  const n = Number(Array.isArray(value) ? value[0] : value)
  return [7, 30, 90].includes(n) ? n : 30
}
