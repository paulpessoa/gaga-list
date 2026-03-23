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

    // 1. Verificar Custos Dinâmicos
    const costs = await SettingsService.getAICosts(supabase)
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
          error:
            `Energia insuficiente. Você precisa de ${requiredCredits} grãos para escanear fotos.`
        },
        { status: 403 }
      )
    }

    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { error: "Configuração de IA ausente" },
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
          role: "system",
          content:
            'Você é um especialista em extração de dados (OCR). Sua tarefa é ler imagens de listas de compras e transformar em dados estruturados. Retorne estritamente um objeto JSON com a chave \'items\', contendo um array de objetos com as chaves "name", "quantity" e "category". Não inclua explicações ou markdown. Retorne APENAS o JSON puro.'
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: "Extraia todos os itens de compra desta imagem para o formato JSON solicitado."
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
    const items =
      result.items || result.list || (Array.isArray(result) ? result : [])

    // 3. Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "ocr",
      cost: requiredCredits,
      model_used: "gpt-4o-mini"
    })

    return NextResponse.json({ items })
  } catch (error: any) {
    console.error("Erro no OCR AI:", error)
    return NextResponse.json(
      { error: "Erro ao extrair lista da foto", details: error.message },
      { status: 500 }
    )
  }
}
