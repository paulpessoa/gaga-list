"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { SettingsService, DEFAULT_AI_COSTS } from "@/services/settings.service"

/**
 * Hook para acessar os custos de IA dinamicamente.
 * Garante que a UI reflita os valores salvos no banco de dados (system_settings).
 */
export function useAICosts() {
  const [costs, setCosts] = useState(DEFAULT_AI_COSTS)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCosts() {
      try {
        const data = await SettingsService.getAICosts(supabase)
        setCosts(data)
      } catch (error) {
        console.error("Falha ao carregar custos de IA:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCosts()
  }, [])

  return { costs, isLoading }
}
