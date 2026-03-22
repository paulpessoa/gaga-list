import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formata um número de telefone para o padrão internacional do WhatsApp (wa.me)
 * Remove tudo que não é dígito e garante o DDI 55 se necessário.
 */
export function formatPhoneForWhatsApp(
  phone: string | null | undefined
): string {
  if (!phone) return ""

  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, "")

  // Se tiver 10 ou 11 dígitos, assume que é Brasil e adiciona o 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`
  }

  return cleaned
}

/**
 * Formata um valor numérico para o padrão de moeda brasileiro (R$).
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  }).format(value)
}

/**
 * Sanitiza uma string removendo tags HTML e scripts, prevenindo XSS básico.
 * Também limita o tamanho máximo para evitar abusos no banco de dados.
 */
export function sanitizeString(text: string, maxLength: number = 1000): string {
  if (!text) return ""

  return text
    .replace(/<[^>]*>?/gm, "") // Remove tags HTML
    .trim()
    .slice(0, maxLength) // Limita tamanho
}
