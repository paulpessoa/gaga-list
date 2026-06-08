import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"
import { getGeminiApiKey, parseGeminiImage, GEMINI_MODEL } from "@/lib/ai-utils"

/**
 * Identifica produtos de supermercado por imagem usando Gemini 2.0 Flash.
 *
 * PORQUÊ: O Gemini 2.0 Flash suporta visão computacional nativa, eliminando
 * a dependência do OpenAI GPT-4o-mini. Unificamos toda a stack de IA em um
 * único provedor (Google) e uma única chave de API.
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

    const apiKey = getGeminiApiKey()
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente. Defina GEMINI_API_KEY nas variáveis de ambiente." },
        { status: 500 }
      )
    }

    const { image } = await request.json()

    if (!image) {
      return NextResponse.json(
        { error: "Nenhuma imagem enviada" },
        { status: 400 }
      )
    }

    const { data: base64Data, mimeType } = parseGeminiImage(image)

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const result = await model.generateContent([
      {
        text: `Identifique este produto de supermercado na imagem.
Retorne estritamente um objeto JSON com a chave 'data' contendo:
- "name": nome do produto
- "brand": marca
- "category": categoria (ex: Laticínios, Bebidas, etc.)
- "benefits": breve texto sobre saúde/uso
- "suggested_uses": array de 3 a 5 strings com ideias de uso ou receitas
- "suggested_title": nome curto para uma lista baseada neste item (ex: "Compras de Laticínios")
Não inclua explicações ou blocos de código markdown. Retorne APENAS o JSON puro.`
      },
      {
        inlineData: {
          mimeType,
          data: base64Data
        }
      }
    ])

    const content = result.response.text().replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(content)
    const finalData = parsed.data || parsed

    // Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "vision",
      cost: requiredCredits,
      model_used: GEMINI_MODEL
    })

    return NextResponse.json({ data: finalData })
  } catch (error: any) {
    console.error("VISION ERROR:", error)
    return NextResponse.json(
      { error: "Erro ao analisar imagem com IA", details: error.message },
      { status: 500 }
    )
  }
}

