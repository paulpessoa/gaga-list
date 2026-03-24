"use client"

import { DEFAULT_AI_COSTS } from "@/services/settings.service"

/**
 * Hook para acessar os custos de IA.
 * PORQUÊ: Retorna os valores de forma imediata sem latência de rede.
 * Os valores são baseados nas constantes do sistema (que podem ser sobrescritas por env vars).
 */
export function useAICosts() {
  return { 
    costs: DEFAULT_AI_COSTS, 
    isLoading: false 
  }
}
