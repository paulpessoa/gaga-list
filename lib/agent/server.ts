// lib/agent/server.ts
import type { SupabaseClient } from "@supabase/supabase-js"
import type { PromptList } from "./prompt"

/** Listas do usuário para o contexto do prompt (RLS já inclui as compartilhadas). */
export async function loadPromptLists(supabase: SupabaseClient<any>, userId: string): Promise<PromptList[]> {
  const { data } = await supabase
    .from("lists")
    .select("id, title, owner_id")
    .is("deleted_at", null)
    .order("updated_at", { ascending: false })
  return (data || []).map((l: any) => ({ id: l.id, title: l.title, shared: l.owner_id !== userId }))
}

/**
 * Debita grãos e registra o uso, no mesmo padrão das rotas de IA.
 * Retorna false (sem debitar) quando o saldo não cobre o custo.
 */
export async function chargeCredits(
  supabase: SupabaseClient<any>,
  userId: string,
  cost: number,
  feature: string,
  model: string
): Promise<boolean> {
  const { data: profile } = await supabase.from("profiles").select("credits").eq("id", userId).single()
  if (!profile || (profile.credits ?? 0) < cost) return false

  await supabase.from("profiles").update({ credits: (profile.credits ?? 0) - cost }).eq("id", userId)
  await supabase.from("ai_usage_logs").insert({ user_id: userId, feature, cost, model_used: model })
  return true
}
