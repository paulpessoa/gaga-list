import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formata um número de telefone para o padrão internacional do WhatsApp (wa.me)
 * Remove tudo que não é dígito e garante o DDI 55 se necessário.
 */
export function formatPhoneForWhatsApp(phone: string | null | undefined): string {
  if (!phone) return '';

  // Remove todos os caracteres não numéricos
  const cleaned = phone.replace(/\D/g, '');

  // Se tiver 10 ou 11 dígitos, assume que é Brasil e adiciona o 55
  if (cleaned.length === 10 || cleaned.length === 11) {
    return `55${cleaned}`;
  }

  return cleaned;
}
