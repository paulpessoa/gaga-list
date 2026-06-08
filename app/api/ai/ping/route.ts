import { NextResponse } from "next/server"
import { getGeminiApiKey } from "@/lib/ai-utils"

/**
 * Endpoint de diagnóstico — verifica se a chave Gemini está configurada.
 * IMPORTANTE: Não expõe o valor da chave, apenas um status booleano.
 * Remover este endpoint em produção após o diagnóstico.
 */
export async function GET() {
  const key = getGeminiApiKey()

  if (!key) {
    return NextResponse.json({
      status: "error",
      message: "Nenhuma chave Gemini encontrada",
      checked: ["GEMINI_API_KEY", "GOOGLE_AI_STUDIO_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    }, { status: 500 })
  }

  // Testa a chave fazendo uma chamada real mínima
  try {
    const { GoogleGenerativeAI } = await import("@google/generative-ai")
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" })
    const result = await model.generateContent("Responda apenas: OK")
    const text = result.response.text().trim()

    return NextResponse.json({
      status: "ok",
      key_prefix: key.substring(0, 8) + "...",
      model: "gemini-2.0-flash",
      response: text,
    })
  } catch (err: any) {
    return NextResponse.json({
      status: "error",
      key_prefix: key.substring(0, 8) + "...",
      message: err.message,
    }, { status: 500 })
  }
}
