// lib/agent/tools.ts
import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Tools do agente conversacional.
 *
 * PORQUÊ: As tools rodam com o client Supabase da sessão do usuário, então o RLS
 * garante que o agente só enxerga e altera listas que o próprio usuário (dono ou
 * colaborador) poderia mexer pelo app. Os schemas usam o subconjunto de JSON Schema
 * aceito tanto pelo Gemini (functionDeclarations) quanto pela OpenAI (tools).
 */

export type JsonSchema = {
  type: "object" | "string" | "number" | "boolean" | "array"
  description?: string
  properties?: Record<string, JsonSchema>
  required?: string[]
  items?: JsonSchema
}

export type ToolDefinition = {
  name: string
  description: string
  parameters: JsonSchema
}

export type ToolContext = {
  supabase: SupabaseClient<any>
  userId: string
  /** Listas alteradas durante a conversa, para o front invalidar o cache. */
  changedListIds: Set<string>
  listsChanged: { value: boolean }
}

const itemProps: Record<string, JsonSchema> = {
  quantity: { type: "number", description: "Quantidade (padrão 1)" },
  unit: { type: "string", description: "Unidade: kg, g, L, un, cx, pct..." },
  category: { type: "string", description: "Categoria: hortifrúti, açougue, limpeza, frios..." },
  price: { type: "number", description: "Preço unitário em reais" },
  notes: { type: "string", description: "Observação: marca, urgência etc." }
}

export const AGENT_TOOLS: ToolDefinition[] = [
  {
    name: "get_lists",
    description: "Lista todas as listas do usuário (próprias e compartilhadas), com id, título e contagem de itens pendentes.",
    parameters: { type: "object", properties: {} }
  },
  {
    name: "get_list_items",
    description: "Retorna os itens de uma lista (com ids) e um resumo com contagens e totais em reais já calculados.",
    parameters: {
      type: "object",
      properties: {
        list_id: { type: "string", description: "ID da lista" },
        status: { type: "string", description: "'pending' (faltando), 'purchased' (comprados) ou 'all' (padrão)" }
      },
      required: ["list_id"]
    }
  },
  {
    name: "create_list",
    description: "Cria uma nova lista.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Nome da lista" },
        description: { type: "string" },
        icon: { type: "string", description: "Um emoji que represente a lista" }
      },
      required: ["title"]
    }
  },
  {
    name: "update_list",
    description: "Renomeia ou altera descrição/ícone de uma lista.",
    parameters: {
      type: "object",
      properties: {
        list_id: { type: "string" },
        title: { type: "string" },
        description: { type: "string" },
        icon: { type: "string" }
      },
      required: ["list_id"]
    }
  },
  {
    name: "delete_list",
    description: "Move uma lista para a lixeira (pode ser restaurada). Só o dono pode. Confirme com o usuário antes.",
    parameters: {
      type: "object",
      properties: { list_id: { type: "string" } },
      required: ["list_id"]
    }
  },
  {
    name: "add_items",
    description: "Adiciona um ou mais itens a uma lista. Um item por produto.",
    parameters: {
      type: "object",
      properties: {
        list_id: { type: "string" },
        items: {
          type: "array",
          items: {
            type: "object",
            properties: { name: { type: "string", description: "Nome do produto, sem a quantidade" }, ...itemProps },
            required: ["name"]
          }
        }
      },
      required: ["list_id", "items"]
    }
  },
  {
    name: "update_item",
    description: "Edita um item (nome, quantidade, unidade, categoria, preço, observação) ou move para outra lista.",
    parameters: {
      type: "object",
      properties: {
        item_id: { type: "string" },
        name: { type: "string", description: "Novo nome" },
        ...itemProps,
        move_to_list_id: { type: "string", description: "ID da lista de destino, para mover o item" }
      },
      required: ["item_id"]
    }
  },
  {
    name: "set_items_purchased",
    description: "Marca itens como comprados (riscados) ou volta para pendente.",
    parameters: {
      type: "object",
      properties: {
        item_ids: { type: "array", items: { type: "string" } },
        is_purchased: { type: "boolean", description: "true = comprado, false = pendente" }
      },
      required: ["item_ids", "is_purchased"]
    }
  },
  {
    name: "remove_items",
    description: "Exclui itens definitivamente.",
    parameters: {
      type: "object",
      properties: { item_ids: { type: "array", items: { type: "string" } } },
      required: ["item_ids"]
    }
  }
]

const str = (v: unknown, max = 200) =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined
const num = (v: unknown) => {
  const n = typeof v === "string" ? Number(v.replace(",", ".")) : v
  return typeof n === "number" && Number.isFinite(n) && n >= 0 ? n : undefined
}
const ids = (v: unknown) =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string" && x.length > 0).slice(0, 100) : []

/** Remove chaves undefined para não sobrescrever colunas com null. */
const compact = (obj: Record<string, unknown>) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

function summarize(all: any[]) {
  const sum = (rows: any[]) =>
    Math.round(rows.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0) * 100) / 100
  const pending = all.filter((i) => !i.is_purchased)
  const purchased = all.filter((i) => i.is_purchased)
  return {
    total_items: all.length,
    pending: pending.length,
    purchased: purchased.length,
    pending_without_price: pending.filter((i) => i.price == null).length,
    purchased_without_price: purchased.filter((i) => i.price == null).length,
    total_brl: sum(all),
    pending_brl: sum(pending),
    purchased_brl: sum(purchased)
  }
}

/**
 * Resumo atualizado das listas afetadas, devolvido junto das escritas.
 * PORQUÊ: Sem isso o modelo tende a responder totais com um get_list_items lido antes da alteração.
 */
async function summariesAfterChange(supabase: SupabaseClient<any>, listIds: string[]) {
  const unique = [...new Set(listIds)]
  const { data } = await supabase.from("items").select("list_id, price, quantity, is_purchased").in("list_id", unique)
  return Object.fromEntries(unique.map((id) => [id, summarize((data || []).filter((i: any) => i.list_id === id))]))
}

function itemFields(a: Record<string, unknown>) {
  return compact({
    quantity: num(a.quantity),
    unit: str(a.unit, 20),
    category: str(a.category, 50),
    price: num(a.price),
    notes: str(a.notes, 255)
  })
}

async function runTool(name: string, a: Record<string, unknown>, ctx: ToolContext): Promise<unknown> {
  const { supabase, userId } = ctx

  switch (name) {
    case "get_lists": {
      const { data, error } = await supabase
        .from("lists")
        .select("id, title, description, icon, owner_id, items(is_purchased)")
        .is("deleted_at", null)
        .order("updated_at", { ascending: false })
      if (error) throw error
      return (data || []).map((l: any) => ({
        id: l.id,
        title: l.title,
        description: l.description,
        icon: l.icon,
        shared_with_me: l.owner_id !== userId,
        pending_items: (l.items || []).filter((i: any) => !i.is_purchased).length,
        total_items: (l.items || []).length
      }))
    }

    case "get_list_items": {
      const listId = str(a.list_id)
      if (!listId) throw new Error("list_id é obrigatório.")
      const { data, error } = await supabase
        .from("items")
        .select("id, name, quantity, unit, category, price, notes, is_purchased")
        .eq("list_id", listId)
        .order("is_purchased", { ascending: true })
        .order("created_at", { ascending: true })
      if (error) throw error

      const all = data || []
      const items =
        a.status === "pending" ? all.filter((i: any) => !i.is_purchased)
        : a.status === "purchased" ? all.filter((i: any) => i.is_purchased)
        : all
      return { items, summary: summarize(all) }
    }

    case "create_list": {
      const title = str(a.title, 100)
      if (!title) throw new Error("title é obrigatório.")
      const { data, error } = await supabase
        .from("lists")
        .insert({ title, description: str(a.description, 255) ?? null, icon: str(a.icon, 8) ?? "🛒", owner_id: userId })
        .select("id, title, icon")
        .single()
      if (error) throw error
      ctx.listsChanged.value = true
      return data
    }

    case "update_list": {
      const listId = str(a.list_id)
      const updates = compact({ title: str(a.title, 100), description: str(a.description, 255), icon: str(a.icon, 8) })
      if (!listId || !Object.keys(updates).length) throw new Error("Informe list_id e ao menos um campo.")
      const { data, error } = await supabase.from("lists").update(updates).eq("id", listId).select("id, title, icon")
      if (error) throw error
      if (!data?.length) throw new Error("Lista não encontrada ou sem permissão.")
      ctx.listsChanged.value = true
      return data[0]
    }

    case "delete_list": {
      const listId = str(a.list_id)
      if (!listId) throw new Error("list_id é obrigatório.")
      const { data, error } = await supabase
        .from("lists")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", listId)
        .eq("owner_id", userId)
        .select("id, title")
      if (error) throw error
      if (!data?.length) throw new Error("Lista não encontrada ou você não é o dono.")
      ctx.listsChanged.value = true
      return { moved_to_trash: data[0].title }
    }

    case "add_items": {
      const listId = str(a.list_id)
      const raw = Array.isArray(a.items) ? (a.items as Record<string, unknown>[]).slice(0, 50) : []
      const rows = raw
        .map((it) => ({ name: str(it?.name, 100), ...itemFields(it || {}) }))
        .filter((it) => it.name)
        .map((it) => ({ quantity: 1, ...it, list_id: listId, added_by: userId, is_purchased: false }))
      if (!listId || !rows.length) throw new Error("Informe list_id e ao menos um item com nome.")
      const { data, error } = await supabase.from("items").insert(rows).select("id, name, quantity, unit")
      if (error) throw error
      ctx.changedListIds.add(listId)
      ctx.listsChanged.value = true
      return { added: data, list_summary: await summariesAfterChange(supabase, [listId]) }
    }

    case "update_item": {
      const itemId = str(a.item_id)
      const updates = compact({ name: str(a.name, 100), ...itemFields(a), list_id: str(a.move_to_list_id) })
      if (!itemId || !Object.keys(updates).length) throw new Error("Informe item_id e ao menos um campo.")
      const { data: before } = await supabase.from("items").select("list_id").eq("id", itemId).maybeSingle()
      const fromListId: string | undefined = before?.list_id
      const { data, error } = await supabase.from("items").update(updates).eq("id", itemId).select("id, name, list_id")
      if (error) throw error
      if (!data?.length) throw new Error("Item não encontrado ou sem permissão.")
      if (fromListId) ctx.changedListIds.add(fromListId)
      ctx.changedListIds.add(data[0].list_id)
      if (updates.list_id) ctx.listsChanged.value = true
      const affected = [fromListId, data[0].list_id].filter((id): id is string => !!id)
      return { updated: data[0], list_summary: await summariesAfterChange(supabase, affected) }
    }

    case "set_items_purchased": {
      const itemIds = ids(a.item_ids)
      if (!itemIds.length || typeof a.is_purchased !== "boolean") throw new Error("Informe item_ids e is_purchased.")
      const { data, error } = await supabase
        .from("items")
        .update(
          a.is_purchased
            ? { is_purchased: true, checked_by: userId, checked_at: new Date().toISOString() }
            : { is_purchased: false, checked_by: null, checked_at: null }
        )
        .in("id", itemIds)
        .select("id, name, list_id")
      if (error) throw error
      if (!data?.length) throw new Error("Nenhum item encontrado.")
      data.forEach((i: any) => ctx.changedListIds.add(i.list_id))
      ctx.listsChanged.value = true
      return {
        updated: data.map((i: any) => i.name),
        is_purchased: a.is_purchased,
        list_summary: await summariesAfterChange(supabase, data.map((i: any) => i.list_id))
      }
    }

    case "remove_items": {
      const itemIds = ids(a.item_ids)
      if (!itemIds.length) throw new Error("Informe item_ids.")
      const { data, error } = await supabase.from("items").delete().in("id", itemIds).select("id, name, list_id")
      if (error) throw error
      if (!data?.length) throw new Error("Nenhum item encontrado ou sem permissão.")
      data.forEach((i: any) => ctx.changedListIds.add(i.list_id))
      ctx.listsChanged.value = true
      return { removed: data.map((i: any) => i.name), list_summary: await summariesAfterChange(supabase, data.map((i: any) => i.list_id)) }
    }

    default:
      throw new Error(`Tool desconhecida: ${name}`)
  }
}

/**
 * Executa uma tool e devolve o erro como dado (em vez de lançar), para o modelo
 * poder se corrigir ou explicar o problema ao usuário.
 */
export async function executeTool(name: string, args: Record<string, unknown>, ctx: ToolContext) {
  try {
    return await runTool(name, args || {}, ctx)
  } catch (err: any) {
    console.warn(`AGENT TOOL ${name} falhou:`, err?.message)
    return { error: err?.message || "Falha ao executar a ação." }
  }
}
