'use client';

import { useProfile } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useHaptic } from '@/hooks/use-haptic';
import { aiCreditModal } from '@/hooks/use-ai-credit-modal';

export function useAICreditCheck() {
  const { data: profile } = useProfile();
  const { trigger } = useHaptic();

  const credits = profile?.credits || 0;

  /**
   * Verifica créditos e executa a ação ou abre o modal global.
   * @param required Quantidade de créditos necessária
   * @param onAllow Função a ser executada se tiver crédito
   */
  const checkAndAct = (required: number = 1, onAllow: () => void) => {
    if (credits < required) {
      trigger('heavy');
      aiCreditModal.open();
      return false;
    }
    onAllow();
    return true;
  };

  return {
    hasCredits: (required: number = 1) => credits >= required,
    credits,
    checkAndAct
  };
}
