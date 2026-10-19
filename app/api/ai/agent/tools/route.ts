import { NextResponse } from "next/server"
import { z } from "zod"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"
import { AGENT_TOOLS, executeTool, type ToolContext } from "@/lib/agent/tools"

export const runtime = "nodejs"

const TOOL_NAMES = AGENT_TOOLS.map((t) => t.name) as [string, ...string[]]

const BodySchema = z.object({
  name: z.enum(TOOL_NAMES),
  args: z.record(z.string(), z.unknown()).default({})
})

/**
 * Executa uma tool do agente pedida pela sessão de voz (Gemini Live).
 * PORQUÊ: No Live o modelo conversa direto com o navegador, mas as tools continuam
 * rodando aqui, com a sessão do usuário e RLS, iguais às do chat de texto.
 */
export async function POST(request: Request) {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const parsed = BodySchema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) {
    return NextResponse.json({ error: "Tool inválida" }, { status: 400 })
  }

  const ctx: ToolContext = {
    supabase: supabase as unknown as SupabaseClient<any>,
    userId: user.id,
    changedListIds: new Set(),
    listsChanged: { value: false }
  }
  const result = await executeTool(parsed.data.name, parsed.data.args, ctx)

  return NextResponse.json({
    result,
    changedListIds: [...ctx.changedListIds],
    listsChanged: ctx.listsChanged.value
  })
}
