import { NextResponse } from "next/server"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"
import { GEMINI_LIVE_MODEL } from "@/lib/ai-utils"
import { chargeCredits } from "@/lib/agent/server"

export const runtime = "nodejs"

/**
 * Cobra cada minuto adicional de uma conversa por voz.
 * O cliente chama a cada minuto e encerra a sessão quando recebe 403.
 */
export async function POST() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const cost = SettingsService.getAICosts().cost_live_minute
  const charged = await chargeCredits(supabase as unknown as SupabaseClient<any>, user.id, cost, "live", GEMINI_LIVE_MODEL)
  if (!charged) {
    return NextResponse.json({ error: "Seus grãos acabaram. Encerrando a conversa por voz." }, { status: 403 })
  }
  return NextResponse.json({ ok: true })
}
