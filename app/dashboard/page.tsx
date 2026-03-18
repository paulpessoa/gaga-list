// app/dashboard/page.tsx
'use client';

import { useLists, useCreateList, useDeleteList } from '@/hooks/use-lists';
import { useUser } from '@/hooks/use-user';
import { useHaptic } from '@/hooks/use-haptic';
import { Plus, ShoppingBag, WifiOff, LogOut, User, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: lists, isLoading, isError } = useLists();
  const { data: user } = useUser();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const { trigger } = useHaptic();
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    console.log('User in Dashboard:', user);
  }, [user]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleCreateList = () => {
    trigger('medium');
    createList.mutate({
      title: 'Nova Lista ' + Math.floor(Math.random() * 100),
      color_theme: 'indigo',
    });
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/';
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <Link href="/dashboard/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
            <User className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Minhas Listas</h1>
            {user?.email && (
              <p className="text-sm text-zinc-500">{user.email}</p>
            )}
          </div>
        </Link>
        
        <div className="flex items-center gap-4">
          {isOffline && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
            </div>
          )}
          <button onClick={handleLogout} className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100 cursor-pointer">
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Create Button */}
        <button 
          onClick={handleCreateList}
          disabled={createList.isPending}
          className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center gap-3 h-40 hover:bg-zinc-800/50 transition-colors group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Plus className="w-6 h-6 text-zinc-400 group-hover:text-zinc-100" />
          </div>
          <span className="text-sm font-medium text-zinc-400 group-hover:text-zinc-100">
            {createList.isPending ? 'Criando...' : 'Criar Nova Lista'}
          </span>
        </button>

        {/* Lists */}
        {isLoading ? (
          <div className="glass-panel rounded-2xl p-6 h-40 animate-pulse flex items-center justify-center">
            <span className="text-zinc-500">Carregando listas...</span>
          </div>
        ) : isError ? (
          <div className="glass-panel rounded-2xl p-6 h-40 flex items-center justify-center border-red-500/20">
            <span className="text-red-400 text-sm text-center">
              Erro ao carregar listas.<br/>Verifique a conexão com o Supabase.
            </span>
          </div>
        ) : lists?.length === 0 ? (
          <div className="glass-panel rounded-2xl p-6 h-40 flex items-center justify-center">
            <span className="text-zinc-500 text-sm">Nenhuma lista encontrada.</span>
          </div>
        ) : (
          lists?.map((list) => (
            <div key={list.id} className="relative group">
              <Link href={`/dashboard/lists/${list.id}`} className="glass-panel rounded-2xl p-6 flex flex-col justify-between h-40 hover:border-zinc-700 transition-colors cursor-pointer block">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{list.icon}</span>
                    <h3 className="font-medium text-lg">{list.title}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Atualizado hoje</span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900"></div>
                    <div className="w-6 h-6 rounded-full bg-zinc-700 border border-zinc-900"></div>
                  </div>
                </div>
              </Link>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (confirm('Tem certeza que deseja deletar esta lista?')) {
                    deleteList.mutate(list.id);
                  }
                }}
                className="absolute top-4 right-4 p-2 rounded-full bg-zinc-900/80 text-zinc-400 hover:text-red-400 hover:bg-zinc-800 opacity-0 group-hover:opacity-100 transition-all z-10"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
