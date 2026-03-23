'use client';

import { useProfile } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useHaptic } from '@/hooks/use-haptic';
import { aiCreditModal } from '@/hooks/use-ai-credit-modal';

export function useAICreditCheck() {
  const { data: profile, isLoading } = useProfile();
  const { trigger } = useHaptic();

  /**
   * Verifica créditos e executa a ação ou abre o modal global.
   * @param required Quantidade de créditos necessária
   * @param onAllow Função a ser executada se tiver crédito
   */
  const checkAndAct = (required: number, onAllow: () => void) => {
    // Se o perfil ainda está carregando, não fazemos nada para evitar bloqueio indevido
    if (isLoading) return false;

    const currentCredits = profile?.credits ?? 0;
    const requiredNum = Number(required);
    const finalRequired = isNaN(requiredNum) ? 1 : requiredNum;

    if (currentCredits < finalRequired) {
      trigger('heavy');
      aiCreditModal.open();
      return false;
    }
    onAllow();
    return true;
  };

  return {
    hasCredits: (required: number = 1) => (profile?.credits ?? 0) >= required,
    credits: profile?.credits ?? 0,
    checkAndAct,
    isLoading
  };
}
