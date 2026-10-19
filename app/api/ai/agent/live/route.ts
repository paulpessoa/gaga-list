import { NextResponse } from "next/server"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"
import { getGeminiApiKey, GEMINI_LIVE_MODEL, LIVE_MAX_MINUTES } from "@/lib/ai-utils"
import { buildAgentSystemPrompt } from "@/lib/agent/prompt"
import { createLiveToken } from "@/lib/agent/live-token"
import { chargeCredits, loadPromptLists } from "@/lib/agent/server"

export const runtime = "nodejs"

const BodySchema = z.object({ listId: z.string().nullish() })

/**
 * Inicia uma sessão de voz em tempo real (Gemini Live) e cobra o primeiro minuto.
 * O áudio vai direto do navegador para o Gemini; as tools rodam em /api/ai/agent/tools.
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

    const parsed = BodySchema.safeParse(await request.json().catch(() => ({})))
    const listId = parsed.success ? parsed.data.listId : null

    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente. Defina GEMINI_API_KEY nas variáveis de ambiente." },
        { status: 500 }
      )
    }

    const db = supabase as unknown as SupabaseClient<any>
    const lists = await loadPromptLists(db, user.id)
    const currentList = lists.find((l) => l.id === listId) || null
    const token = await createLiveToken(apiKey, buildAgentSystemPrompt(lists, currentList, "voice"))

    // Cobra o primeiro minuto só depois que o token foi criado com sucesso
    const cost = SettingsService.getAICosts().cost_live_minute
    if (!(await chargeCredits(db, user.id, cost, "live", GEMINI_LIVE_MODEL))) {
      return NextResponse.json(
        { error: `Energia insuficiente. A conversa por voz usa ${cost} grão(s) por minuto.` },
        { status: 403 }
      )
    }

    return NextResponse.json({ token, model: GEMINI_LIVE_MODEL, maxMinutes: LIVE_MAX_MINUTES })
  } catch (error: any) {
    console.error("LIVE START ERROR:", error)
    return NextResponse.json(
      { error: "A conversa por voz está indisponível agora. Você pode continuar por texto.", details: error.message },
      { status: 500 }
    )
  }
}
