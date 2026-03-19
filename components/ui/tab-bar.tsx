'use client';

import { LayoutGrid, User, Settings, ShoppingBag, Bell } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useNotifications } from '@/providers/notification-provider';

export function TabBar() {
  const pathname = usePathname();
  const { unreadCount } = useNotifications();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 flex items-center justify-around px-6 z-50 md:hidden">
      <Link 
        href="/dashboard" 
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/dashboard') ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <LayoutGrid className="w-6 h-6" />
        <span className="text-[10px] font-medium">Listas</span>
      </Link>

      <Link 
        href="/dashboard/notifications" 
        className={`flex flex-col items-center gap-1 transition-colors relative ${isActive('/dashboard/notifications') ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-lg border border-zinc-950">
            {unreadCount}
          </span>
        )}
        <span className="text-[10px] font-medium">Avisos</span>
      </Link>

      <Link 
        href="/dashboard/profile" 
        className={`flex flex-col items-center gap-1 transition-colors ${isActive('/dashboard/profile') ? 'text-indigo-400' : 'text-zinc-500 hover:text-zinc-300'}`}
      >
        <Settings className="w-6 h-6" />
        <span className="text-[10px] font-medium">Config</span>
      </Link>
    </nav>
  );
}
