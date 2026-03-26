import { NextResponse } from "next/server"
import Groq from "groq-sdk"
import { GoogleGenerativeAI } from "@google/generative-ai"
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

    const groqKey = process.env.GROQ_API_KEY
    const geminiKey = process.env.GOOGLE_AI_STUDIO_API_KEY

    if (!groqKey || !geminiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente (GROQ ou Gemini)" },
        { status: 500 }
      )
    }

    const groq = new Groq({ apiKey: groqKey })
    const genAI = new GoogleGenerativeAI(geminiKey)
    const geminiModel = genAI.getGenerativeModel({
      model: "gemini-flash-latest"
    })

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json(
        { error: "Nenhum arquivo de áudio enviado" },
        { status: 400 }
      )
    }

    // 1. Transcrever áudio usando Whisper no GROQ
    const transcription = await groq.audio.transcriptions.create({
      file: file,
      model: "whisper-large-v3",
      language: "pt",
      response_format: "text"
    })

    const text =
      typeof transcription === "string"
        ? transcription
        : (transcription as any).text

    // 2. Extrair itens usando Gemini
    const prompt = `Você é um assistente de compras inteligente. 
    Extraia os itens de compra e um TÍTULO sugerido do seguinte texto transcrito de áudio: "${text}"
    
    Retorne UM JSON com o seguinte formato:
    {
      "items": [{"name": "item", "quantity": "quantidade", "category": "categoria", "unit": "unidade", "price": 0, "notes": "obs"}],
      "suggested_title": "Um título curto e amigável baseado no contexto (ex: Mercado, Churrasco, Café da Manhã). Se não houver contexto, use 'Nova Lista'.",
      "hint": "Caso o texto esteja confuso, sugira aqui como o usuário deve falar. Ex: 'Tente dizer: Comprar 2kg de arroz por 10 reais'. Se estiver ok, deixe null."
    }
    
    Regras:
    - Se não houver itens claros, o array "items" deve ser vazio e o "hint" deve ser preenchido com uma orientação educativa.
    - O "suggested_title" deve ser curto (máximo 3 palavras).
    - Se houver itens, extraia o máximo de detalhes possível (quantidade, unidade, preço se mencionado).
    - Retorne APENAS o JSON puro.`

    const result = await geminiModel.generateContent(prompt)
    const response = await result.response
    const rawText = response.text()

    // Parsing robusto
    let finalData = { items: [], hint: null, suggested_title: "Nova Lista" }
    try {
      const jsonText = rawText.replace(/```json|```/g, "").trim()
      const parsedResult = JSON.parse(jsonText)
      finalData.items = parsedResult.items || []
      finalData.hint = parsedResult.hint || null
      finalData.suggested_title = parsedResult.suggested_title || "Nova Lista"
    } catch (e) {
      console.warn("Falha ao parsear JSON da IA:", e)
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
      model_used: "whisper-large-v3 + gemini-flash-latest"
    } as any)

    return NextResponse.json({
      transcription: text,
      items: finalData.items,
      hint: finalData.hint,
      suggested_title: finalData.suggested_title
    })
  } catch (error: any) {
    console.error("BLABLA #5 VOICE ERROR:", error)
    return NextResponse.json(
      { error: "Erro ao processar voz com IA", details: error.message },
      { status: 500 }
    )
  }
}
