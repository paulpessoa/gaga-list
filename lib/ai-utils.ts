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
 * Usamos 'gemini-3.5-flash-lite', o Flash-Lite mais recente, por excelente custo-benefício e velocidade.
 * Não existe 'gemini-3.8-flash-lite' (a família 3.8 só tem Flash e as variantes de TTS/Live).
 */
export const GEMINI_MODEL = "gemini-3.5-flash-lite"

/**
 * Modelo do Gemini usado pelo agente conversacional. O 3.5 Flash-Lite acertou os mesmos
 * cenários de tool calling que o 3.8 Flash, sendo ~3x mais rápido e mais barato.
 * Pode ser sobrescrito por GEMINI_AGENT_MODEL (ex.: "gemini-3.8-flash").
 */
export const GEMINI_AGENT_MODEL = process.env.GEMINI_AGENT_MODEL || GEMINI_MODEL

/**
 * Modelo e voz do modo de conversa por voz em tempo real (Gemini Live API).
 * Podem ser sobrescritos por GEMINI_LIVE_MODEL e GEMINI_LIVE_VOICE.
 */
export const GEMINI_LIVE_MODEL = process.env.GEMINI_LIVE_MODEL || "gemini-3.8-live"
export const GEMINI_LIVE_VOICE = process.env.GEMINI_LIVE_VOICE || "Aoede"

/** Duração máxima de uma sessão de voz (o Live exige reconexão a cada ~10 min). */
export const LIVE_MAX_MINUTES = 10

/**
 * Modelo da OpenAI usado como fallback do agente conversacional quando o Gemini falha.
 * Pode ser sobrescrito pela variável OPENAI_AGENT_MODEL.
 */
export const OPENAI_AGENT_MODEL = process.env.OPENAI_AGENT_MODEL || "gpt-4o-mini"

export const GEMINI_FALLBACK_MODELS = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite"
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
