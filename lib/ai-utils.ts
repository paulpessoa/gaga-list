export function cleanBase64Image(base64: string): string {
  // Remove prefixos como data:image/jpeg;base64, se existirem
  if (base64.startsWith('data:image')) {
    return base64; // GROQ aceita o formato completo data:image/...
  }
  // Se for apenas a string base64 pura, adiciona um prefixo genérico para o GROQ
  return `data:image/jpeg;base64,${base64}`;
}
