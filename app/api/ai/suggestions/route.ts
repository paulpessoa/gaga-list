import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"
import { getGeminiApiKey, GEMINI_MODEL } from "@/lib/ai-utils"

/**
 * Sugere benefícios e usos de produtos usando Gemini.
 *
 * PORQUÊ: Substituímos o Groq (Llama 3.3-70b) pelo Gemini para unificar
 * toda a stack de IA em um único provedor e uma única chave de API,
 * simplificando a gestão de secrets e reduzindo dependências externas.
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
    const requiredCredits = costs.cost_suggestion

    // 2. Verificar Créditos (Grãos)
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()
    if (!profile || (profile.credits ?? 0) < requiredCredits) {
      return NextResponse.json(
        {
          error: `Energia insuficiente. Você precisa de ${requiredCredits} grão(s).`
        },
        { status: 403 }
      )
    }

    const apiKey = getGeminiApiKey()
    if (!apiKey)
      return NextResponse.json(
        { error: "Configuração de IA ausente. Defina GEMINI_API_KEY nas variáveis de ambiente." },
        { status: 500 }
      )

    const { productName, brand, category } = await request.json()

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const result = await model.generateContent(
      `Você é um chef e nutricionista falando Português do Brasil.
Com base no produto abaixo, retorne um JSON com:
- "benefits": texto curto sobre saúde e uso do produto
- "suggested_uses": array de 3 a 5 ideias de uso ou receitas

Produto: ${productName}, Marca: ${brand}, Categoria: ${category}

Retorne APENAS o JSON puro, sem blocos de código markdown.`
    )

    const rawText = result.response.text().replace(/```json|```/g, "").trim()
    const parsed = JSON.parse(rawText)

    // 3. Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "suggestion",
      cost: requiredCredits,
      model_used: GEMINI_MODEL
    })

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error("SUGGESTION ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

