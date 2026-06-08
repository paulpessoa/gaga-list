import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"

/**
 * Extrai itens de uma foto de lista de compras via OCR usando Gemini 2.0 Flash.
 *
 * PORQUÊ: O Gemini 2.0 Flash suporta visão computacional nativa, eliminando
 * a dependência do OpenAI GPT-4o-mini. Mesma API key, menor custo operacional.
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
    const requiredCredits = costs.cost_ocr

    // 2. Verificar Créditos (Grãos)
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()
    if (!profile || (profile.credits ?? 0) < requiredCredits) {
      return NextResponse.json(
        {
          error: `Energia insuficiente. Você precisa de ${requiredCredits} grãos para escanear fotos.`
        },
        { status: 403 }
      )
    }

    const apiKey = process.env.GOOGLE_AI_STUDIO_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente (GOOGLE_AI_STUDIO_API_KEY)" },
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

    // Extrair apenas os dados base64 (remover prefixo data:image/...;base64,)
    const base64Data = image.includes(",") ? image.split(",")[1] : image
    const mimeTypeMatch = image.match(/data:([^;]+);base64/)
    const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg"

    const genAI = new GoogleGenerativeAI(apiKey)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })

    const result = await model.generateContent([
      {
        text: `Você é um especialista em extração de dados (OCR). Leia esta imagem de lista de compras e transforme em dados estruturados.
Retorne estritamente um objeto JSON com as chaves:
- "items": array de objetos com "name", "quantity", "category"
- "suggested_title": string curta baseada no contexto da lista (ex: "Compras de Domingo")
Não inclua explicações ou markdown. Retorne APENAS o JSON puro.`
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
    const items = parsed.items || []
    const suggested_title = parsed.suggested_title || "Lista via Foto"

    // 3. Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "ocr",
      cost: requiredCredits,
      model_used: "gemini-2.0-flash"
    })

    return NextResponse.json({ items, suggested_title })
  } catch (error: any) {
    console.error("OCR ERROR:", error)
    return NextResponse.json(
      { error: "Erro ao extrair lista da foto", details: error.message },
      { status: 500 }
    )
  }
}

