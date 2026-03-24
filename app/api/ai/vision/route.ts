import { NextResponse } from "next/server"
import OpenAI from "openai"
import { cleanBase64Image } from "@/lib/ai-utils"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // 1. Verificar Custos (Síncrono para velocidade)
    const costs = SettingsService.getAICosts()
    const requiredCredits = costs.cost_vision

    // 2. Verificar Créditos (Grãos)
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()
    if (!profile || (profile.credits ?? 0) < requiredCredits) {
      return NextResponse.json(
        {
          error: `Energia insuficiente. Você precisa de ${requiredCredits} grãos.`
        },
        { status: 403 }
      )
    }
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente (OPENAI_API_KEY)" },
        { status: 500 }
      )
    }

    const openai = new OpenAI({ apiKey })

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "Nenhuma imagem enviada" },
        { status: 400 }
      )
    }

    const finalImage = cleanBase64Image(image)

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Identifique este produto de supermercado. Retorne estritamente um objeto JSON com a chave 'data' contendo: 'name', 'brand', 'category', 'benefits' (breve texto), 'suggested_uses' (array de strings). Não inclua explicações ou blocos de código markdown. Retorne APENAS o JSON puro."
            },
            {
              type: "image_url",
              image_url: {
                url: finalImage
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" }
    })

    const content = response.choices[0]?.message?.content || "{}"
    const result = JSON.parse(content)
    const finalData = result.data || result

    // Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "vision",
      cost: requiredCredits,
      model_used: "gpt-4o-mini"
    })

    return NextResponse.json({ data: finalData })
  } catch (error: any) {
    console.error("BLABLA #4 VISION ERROR:", error)
    return NextResponse.json(
      { error: "Erro ao analisar imagem com IA", details: error.message },
      { status: 500 }
    )
  }
}
