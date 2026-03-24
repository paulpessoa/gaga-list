import { NextResponse } from "next/server"
import Groq from "groq-sdk"
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

    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey)
      return NextResponse.json({ error: "Erro de config" }, { status: 500 })

    const groq = new Groq({ apiKey })
    const { productName, brand, category } = await request.json()

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content:
            'Você é um chef e nutricionista. Com base em um produto, retorne um JSON com "benefits" (texto curto sobre saúde/uso) e "suggested_uses" (array de 3 a 5 ideias de uso ou receitas).'
        },
        {
          role: "user",
          content: `Produto: ${productName}, Marca: ${brand}, Categoria: ${category}`
        }
      ],
      model: "llama-3.3-70b-versatile",
      response_format: { type: "json_object" }
    })

    // 3. Deduzir créditos e logar
    await supabase
      .from("profiles")
      .update({ credits: (profile.credits ?? 0) - requiredCredits })
      .eq("id", user.id)
    await supabase.from("ai_usage_logs").insert({
      user_id: user.id,
      feature: "suggestion",
      cost: requiredCredits,
      model_used: "llama-3.3"
    })

    return NextResponse.json(
      JSON.parse(completion.choices[0]?.message?.content || "{}")
    )
  } catch (error: any) {
    console.error("BLABLA #3 SUGGESTION ERROR:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
