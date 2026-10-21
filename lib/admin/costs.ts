import { PLAN_CONFIGS } from "@/services/settings.service"

/**
 * Custo ESTIMADO (R$) de cada chamada de IA, por feature registrada em ai_usage_logs.
 * PORQUÊ: os provedores não devolvem custo por request; esta tabela é a régua
 * usada pelo painel admin para calcular margem. Ajuste quando trocar de modelo.
 */
export const API_COSTS: Record<string, { model: string; estimated_brl: number }> = {
  recipe: { model: "Gemini 3.5 Flash-Lite", estimated_brl: 0.005 },
  ocr: { model: "GPT-4o-mini", estimated_brl: 0.02 },
  vision: { model: "GPT-4o-mini", estimated_brl: 0.03 },
  voice: { model: "Whisper + Gemini", estimated_brl: 0.015 },
  suggestion: { model: "Llama 3.3", estimated_brl: 0.002 },
  agent: { model: "Gemini 3.5 Flash-Lite (fallback GPT-4o-mini)", estimated_brl: 0.01 },
  live: { model: "Gemini 3.8 Live (por minuto)", estimated_brl: 0.13 }
}

export function estimateApiCost(feature: string) {
  return API_COSTS[feature]?.estimated_brl ?? 0
}

/**
 * Receita estimada de uma recarga (log com cost negativo, feature "recharge").
 * Casa a quantidade de grãos com o plano correspondente; se não casar,
 * usa o preço por grão do plano Broto como aproximação.
 */
export function estimateRechargeRevenue(grains: number) {
  const plan = Object.values(PLAN_CONFIGS).find((p) => p.grains === grains && p.amount > 0)
  if (plan) return plan.amount / 100
  const broto = PLAN_CONFIGS.broto
  return (grains / broto.grains) * (broto.amount / 100)
}
