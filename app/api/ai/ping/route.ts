import { NextResponse } from "next/server"
import { GoogleGenerativeAI } from "@google/generative-ai"
import { getGeminiApiKey } from "@/lib/ai-utils"

/**
 * Endpoint de diagnóstico — verifica qual modelo Gemini está disponível.
 * Testa modelos em ordem de preferência e retorna o primeiro que responder.
 * IMPORTANTE: Remover ou proteger este endpoint após o diagnóstico.
 */
export async function GET() {
  const key = getGeminiApiKey()

  if (!key) {
    return NextResponse.json({
      status: "error",
      message: "Nenhuma chave Gemini encontrada",
      checked_vars: ["GEMINI_API_KEY", "GOOGLE_AI_STUDIO_API_KEY", "GOOGLE_GENERATIVE_AI_API_KEY"],
    }, { status: 500 })
  }

  const modelsToTry = [
    "gemini-2.0-flash",
    "gemini-2.0-flash-lite",
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash-latest",
    "gemini-pro",
  ]

  const genAI = new GoogleGenerativeAI(key)
  const results: Record<string, string> = {}

  for (const modelName of modelsToTry) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName })
      const result = await model.generateContent("Responda apenas: OK")
      const text = result.response.text().trim()
      results[modelName] = `✅ OK — "${text}"`
      // Retorna assim que o primeiro modelo funcionar
      return NextResponse.json({
        status: "ok",
        key_prefix: key.substring(0, 10) + "...",
        working_model: modelName,
        response: text,
        all_results: results,
      })
    } catch (err: any) {
      const code = err.message.includes("429") ? "429 quota" :
                   err.message.includes("404") ? "404 not found" :
                   err.message.includes("403") ? "403 forbidden" : "error"
      results[modelName] = `❌ ${code}`
    }
  }

  return NextResponse.json({
    status: "error",
    key_prefix: key.substring(0, 10) + "...",
    message: "Nenhum modelo disponível",
    all_results: results,
  }, { status: 500 })
}
