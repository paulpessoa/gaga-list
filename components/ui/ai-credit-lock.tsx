'use client';

import { ReactNode } from 'react';
import { Lock, Zap, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useProfile } from '@/hooks/use-user';
import { useHaptic } from '@/hooks/use-haptic';

interface AICreditLockProps {
  children: ReactNode;
  requiredCredits?: number;
  className?: string;
  variant?: 'inline' | 'overlay';
}

export function AICreditLock({ children, requiredCredits = 1, className = '', variant = 'inline' }: AICreditLockProps) {
  const { data: profile } = useProfile();
  const { trigger } = useHaptic();
  
  const credits = profile?.credits || 0;
  const isLocked = credits < requiredCredits;

  if (!isLocked) return <>{children}</>;

  if (variant === 'overlay') {
    return (
      <div className={`relative group ${className}`}>
        <div className="opacity-40 pointer-events-none grayscale">
          {children}
        </div>
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-zinc-950/40 backdrop-blur-[2px] rounded-2xl border border-white/5 shadow-inner">
           <Lock className="w-5 h-5 text-amber-500 mb-2" />
           <Link 
             href="/app/credits"
             onClick={() => trigger('medium')}
             className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
           >
             <Zap className="w-3.5 h-3.5 fill-current" /> Comprar Grãos
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl ${className}`}>
       <div className="flex items-center gap-2">
         <div className="w-7 h-7 rounded-lg bg-amber-500/20 flex items-center justify-center">
            <Lock className="w-3.5 h-3.5 text-amber-500" />
         </div>
         <p className="text-[10px] font-black uppercase tracking-widest text-amber-600">Funcionalidade Bloqueada</p>
       </div>
       <p className="text-[10px] text-zinc-500 font-medium">Você precisa de {requiredCredits} grão(s) para usar esta ferramenta.</p>
       <Link 
         href="/app/credits"
         onClick={() => trigger('medium')}
         className="w-full mt-2 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
       >
         <Zap className="w-3.5 h-3.5 fill-current" /> Recarregar agora
       </Link>
    </div>
  );
}
