'use client';

import { useProfile } from '@/hooks/use-user';
import { useRouter } from 'next/navigation';
import { useHaptic } from '@/hooks/use-haptic';

export function useAICreditCheck() {
  const { data: profile } = useProfile();
  const router = useRouter();
  const { trigger } = useHaptic();

  const credits = profile?.credits || 0;

  const checkAndAct = (required: number = 1, onAllow: () => void) => {
    if (credits < required) {
      trigger('error' as any);
      if (confirm(`Você não tem grãos suficientes (${credits}/${required}). Deseja comprar mais agora?`)) {
        router.push('/app/credits');
      }
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
