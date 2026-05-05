// hooks/use-haptic.ts
"use client"

import { useCallback } from "react"

type HapticFeedbackType =
  | "light"
  | "medium"
  | "heavy"
  | "success"
  | "warning"
  | "error"

/**
 * Hook para acionar feedback tátil (vibração) no dispositivo do usuário.
 * Utiliza a Vibration API do navegador, se disponível.
 * Excelente para melhorar a UX em PWAs mobile.
 */
export function useHaptic() {
  const trigger = useCallback((type: HapticFeedbackType = "medium") => {
    // Verifica se a API de vibração é suportada pelo navegador
    if (
      typeof window === "undefined" ||
      !window.navigator ||
      !window.navigator.vibrate
    ) {
      return
    }

    try {
      switch (type) {
        case "light":
          window.navigator.vibrate(30)
          break
        case "medium":
          window.navigator.vibrate(60)
          break
        case "heavy":
          window.navigator.vibrate(120)
          break
        case "success":
          // Vibração dupla rápida e clara
          window.navigator.vibrate([40, 60, 40])
          break
        case "warning":
          // Vibração dupla mais longa e tensa
          window.navigator.vibrate([80, 100, 80])
          break
        case "error":
          // Três vibrações fortes
          window.navigator.vibrate([100, 50, 100, 50, 150])
          break
        default:
          window.navigator.vibrate([
            60, 80, 60, 80, 200, 120, 60, 80, 60, 80, 200
          ])
      }
    } catch (error) {
      // Ignora erros silenciosamente (ex: permissões negadas)
      console.warn("Haptic feedback falhou:", error)
    }
  }, [])

  return { trigger }
}
