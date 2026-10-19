import { NextResponse } from "next/server"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"
import { getAvailableProviders, runAgent } from "@/lib/agent/run-agent"
import type { ToolContext } from "@/lib/agent/tools"
import { buildAgentSystemPrompt } from "@/lib/agent/prompt"

export const runtime = "nodejs"
export const maxDuration = 60

const MAX_TURNS = 20

const BodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .refine((m) => m[m.length - 1].role === "user", "A última mensagem deve ser do usuário"),
  listId: z.string().nullish()
})

/**
 * Agente conversacional que conversa e manipula listas e itens via tools.
 * Gemini é o provedor principal; OpenAI entra como fallback (ver lib/agent/run-agent.ts).
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const parsed = BodySchema.safeParse(await request.json().catch(() => null))
    if (!parsed.success) {
      return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 })
    }
    const { messages, listId } = parsed.data

    // 1. Verificar Custos (Síncrono para velocidade)
    const requiredCredits = SettingsService.getAICosts().cost_agent

    // 2. Verificar Créditos (Grãos)
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()
    if (!profile || (profile.credits ?? 0) < requiredCredits) {
      return NextResponse.json(
        { error: `Energia insuficiente. Você precisa de ${requiredCredits} grão(s) para falar com a assistente.` },
        { status: 403 }
      )
    }

    const providers = getAvailableProviders()
    if (!providers.length) {
      return NextResponse.json(
        { error: "Configuração de IA ausente. Defina GEMINI_API_KEY ou OPENAI_API_KEY nas variáveis de ambiente." },
        { status: 500 }
      )
    }

    // RLS já inclui as listas compartilhadas com o usuário
    const { data: listRows } = await supabase
      .from("lists")
      .select("id, title, owner_id")
      .is("deleted_at", null)
      .order("updated_at", { ascending: false })
    const lists = (listRows || []).map((l: any) => ({ id: l.id as string, title: l.title as string, shared: l.owner_id !== user.id }))
    const currentList = lists.find((l) => l.id === listId) || null

    const ctx: ToolContext = {
      supabase: supabase as unknown as SupabaseClient<any>,
      userId: user.id,
      changedListIds: new Set(),
      listsChanged: { value: false }
    }

    const { reply, provider, model } = await runAgent({
      system: buildAgentSystemPrompt(lists, currentList),
      history: messages.slice(-MAX_TURNS),
      ctx,
      providers
    })

    // 3. Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "agent",
      cost: requiredCredits,
      model_used: model
    } as any)

    return NextResponse.json({
      reply,
      provider,
      changedListIds: [...ctx.changedListIds],
      listsChanged: ctx.listsChanged.value
    })
  } catch (error: any) {
    console.error("AGENT ERROR:", error)
    return NextResponse.json(
      { error: "A assistente está indisponível no momento. Tente de novo em instantes.", details: error.message },
      { status: 500 }
    )
  }
}
