// lib/ai-utils.ts

/**
 * Retorna a chave de API do Gemini.
 * Configure a variável GEMINI_API_KEY no painel da Vercel (Settings → Environment Variables).
 */
export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY
}

/**
 * Modelo padrão do Gemini usado em todo o projeto.
 * Usamos 'gemini-1.5-flash' por estabilidade e imunidade a erros 503 do alias 'gemini-flash-latest'.
 */
export const GEMINI_MODEL = "gemini-1.5-flash"

export const GEMINI_FALLBACK_MODELS = [
  "gemini-1.5-flash",
  "gemini-2.5-flash",
  "gemini-flash-latest",
]

/**
 * Extrai os dados necessários de uma imagem base64 para o Gemini (inlineData).
 * Suporta imagens com ou sem o prefixo data URI.
 */
export function parseGeminiImage(image: string): {
  data: string
  mimeType: string
} {
  const mimeTypeMatch = image.match(/data:([^;]+);base64/)
  const mimeType = mimeTypeMatch ? mimeTypeMatch[1] : "image/jpeg"
  const data = image.includes(",") ? image.split(",")[1] : image
  return { data, mimeType }
}

/**
 * Limpa e extrai JSON de uma string retornada pela IA.
 * Frequentemente a IA retorna blocos de código Markdown ou texto extra.
 */
export function extractJSON<T = any>(text: string): T | null {
  try {
    const clean = text.replace(/```json|```/g, "").trim()
    return JSON.parse(clean)
  } catch (e) {
    try {
      const start = text.indexOf("{")
      const end = text.lastIndexOf("}")
      if (start !== -1 && end !== -1) {
        return JSON.parse(text.substring(start, end + 1))
      }
    } catch (innerError) {
      console.error("Erro ao extrair JSON da IA:", innerError)
    }
    return null
  }
}

/**
 * Verifica se o usuário tem créditos suficientes
 */
export function hasSufficientCredits(
  userCredits: number | null | undefined,
  required: number = 1
): boolean {
  if (userCredits === null || userCredits === undefined) return false
  return userCredits >= required
}

export function cleanBase64Image(base64: string): string {
  if (base64.startsWith("data:image")) {
    return base64
  }
  return `data:image/jpeg;base64,${base64}`
}
