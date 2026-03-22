// lib/ai-utils.ts

/**
 * Limpa e extrai JSON de uma string retornada pela IA.
 * Frequentemente a IA retorna blocos de código Markdown ou texto extra.
 */
export function extractJSON<T = any>(text: string): T | null {
  try {
    // Tenta parse direto primeiro
    return JSON.parse(text)
  } catch (e) {
    try {
      // Tenta encontrar o primeiro { e o último }
      const start = text.indexOf("{")
      const end = text.lastIndexOf("}")

      if (start !== -1 && end !== -1) {
        const jsonContent = text.substring(start, end + 1)
        return JSON.parse(jsonContent)
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
  // Remove prefixos como data:image/jpeg;base64, se existirem
  if (base64.startsWith("data:image")) {
    return base64 // GROQ aceita o formato completo data:image/...
  }
  // Se for apenas a string base64 pura, adiciona um prefixo genérico para o GROQ
  return `data:image/jpeg;base64,${base64}`
}
