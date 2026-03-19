'use client';

import { LayoutGrid, User, Settings, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function TabBar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/80 backdrop-blur-lg border-t border-white/5 px-6 py-3 pb-8 md:pb-4 flex justify-around items-center">
      <Link 
        href="/dashboard" 
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/dashboard') ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <LayoutGrid className="w-6 h-6" />
        <span className="text-[10px] font-medium">Listas</span>
      </Link>

      <Link 
        href="/dashboard/profile" 
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/dashboard/profile') ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <User className="w-6 h-6" />
        <span className="text-[10px] font-medium">Perfil</span>
      </Link>

      {/* Botão placeholder para futuras configurações */}
      <button 
        disabled
        className="flex flex-col items-center gap-1 text-zinc-800 cursor-not-allowed"
      >
        <Settings className="w-6 h-6" />
        <span className="text-[10px] font-medium">Config</span>
      </button>
    </nav>
  );
}
