import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { createClient } from "@/lib/supabase/server"
import { SettingsService } from "@/services/settings.service"
import { getGeminiApiKey, GEMINI_MODEL } from "@/lib/ai-utils"

/**
 * Processa áudio de voz para extrair itens de compra usando Gemini 2.0 Flash.
 *
 * PORQUÊ: O Gemini 2.0 Flash suporta áudio nativo como entrada multimodal,
 * eliminando a necessidade do Groq Whisper como etapa separada de transcrição.
 * Isso simplifica a arquitetura (1 SDK, 1 chave) e reduz latência.
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
    const requiredCredits = costs.cost_voice

    // 2. Verificar Créditos (Grãos)
    const { data: profile } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single()
    if (!profile || (profile.credits ?? 0) < requiredCredits) {
      return NextResponse.json(
        {
          error: `Energia insuficiente. Você precisa de ${requiredCredits} grão(s) para usar a voz.`
        },
        { status: 403 }
      )
    }

    const geminiKey = getGeminiApiKey()
    if (!geminiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente. Defina GEMINI_API_KEY nas variáveis de ambiente." },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de áudio enviado" },
        { status: 400 }
      )
    }

    // Converter o arquivo de áudio para base64 para enviar ao Gemini como inlineData
    const arrayBuffer = await file.arrayBuffer()
    const base64Audio = Buffer.from(arrayBuffer).toString("base64")
    const mimeType = (file.type || "audio/webm") as string

    const genAI = new GoogleGenerativeAI(geminiKey)
    // gemini-2.0-flash suporta áudio nativo como entrada multimodal
    const geminiModel = genAI.getGenerativeModel({ model: GEMINI_MODEL })

    const prompt = `Você é um assistente de compras inteligente falando Português do Brasil.
Ouça o áudio e extraia os itens de compra mencionados.

Retorne UM JSON com o seguinte formato:
{
  "transcription": "texto transcrito do áudio",
  "items": [{"name": "item", "quantity": "quantidade", "category": "categoria", "unit": "unidade", "price": 0, "notes": "obs"}],
  "suggested_title": "Um título curto e amigável baseado no contexto (ex: Mercado, Churrasco, Café da Manhã). Se não houver contexto, use 'Nova Lista'.",
  "hint": "Caso o áudio esteja confuso ou não contenha itens de compra, sugira aqui como o usuário deve falar. Ex: 'Tente dizer: Comprar 2kg de arroz por 10 reais'. Se estiver ok, deixe null."
}

Regras:
- Se não houver itens claros, o array "items" deve ser vazio e o "hint" deve ser preenchido com orientação.
- O "suggested_title" deve ter no máximo 3 palavras.
- Extraia o máximo de detalhes possível (quantidade, unidade, preço se mencionado).
- Retorne APENAS o JSON puro, sem blocos de código markdown.`

    const result = await geminiModel.generateContent([
      { text: prompt },
      {
        inlineData: {
          mimeType,
          data: base64Audio
        }
      }
    ])

    const rawText = result.response.text()

    // Parsing robusto do JSON retornado
    let finalData = {
      transcription: "",
      items: [],
      hint: null,
      suggested_title: "Nova Lista"
    }
    try {
      const jsonText = rawText.replace(/```json|```/g, "").trim()
      const parsedResult = JSON.parse(jsonText)
      finalData.transcription = parsedResult.transcription || ""
      finalData.items = parsedResult.items || []
      finalData.hint = parsedResult.hint || null
      finalData.suggested_title = parsedResult.suggested_title || "Nova Lista"
    } catch (e) {
      console.warn("Falha ao parsear JSON da IA (voz):", e)
    }

    // 3. Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "voice",
      cost: requiredCredits,
      model_used: GEMINI_MODEL
    } as any)

    return NextResponse.json({
      transcription: finalData.transcription,
      items: finalData.items,
      hint: finalData.hint,
      suggested_title: finalData.suggested_title
    })
  } catch (error: any) {
    console.error("VOICE ERROR:", error)
    return NextResponse.json(
      { error: "Erro ao processar voz com IA", details: error.message },
      { status: 500 }
    )
  }
}
