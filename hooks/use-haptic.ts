// hooks/use-haptic.ts
'use client';

import { useCallback } from 'react';

type HapticFeedbackType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';

/**
 * Hook para acionar feedback tátil (vibração) no dispositivo do usuário.
 * Utiliza a Vibration API do navegador, se disponível.
 * Excelente para melhorar a UX em PWAs mobile.
 */
export function useHaptic() {
  const trigger = useCallback((type: HapticFeedbackType = 'medium') => {
    // Verifica se a API de vibração é suportada pelo navegador
    if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
      return;
    }

    try {
      switch (type) {
        case 'light':
          window.navigator.vibrate(10);
          break;
        case 'medium':
          window.navigator.vibrate(20);
          break;
        case 'heavy':
          window.navigator.vibrate(40);
          break;
        case 'success':
          // Vibração dupla rápida
          window.navigator.vibrate([15, 50, 15]);
          break;
        case 'warning':
          // Vibração dupla mais longa
          window.navigator.vibrate([30, 50, 30]);
          break;
        case 'error':
          // Três vibrações
          window.navigator.vibrate([20, 40, 20, 40, 20]);
          break;
        default:
          window.navigator.vibrate(20);
      }
    } catch (error) {
      // Ignora erros silenciosamente (ex: permissões negadas)
      console.warn('Haptic feedback falhou:', error);
    }
  }, []);

  return { trigger };
}
