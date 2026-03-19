// app/dashboard/page.tsx
'use client';

import { useLists, useCreateList, useDeleteList } from '@/hooks/use-lists';
import { useUser } from '@/hooks/use-user';
import { useHaptic } from '@/hooks/use-haptic';
import { Plus, ShoppingBag, WifiOff, LogOut, User, Trash2, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const { data: lists, isLoading, isError, error } = useLists();
  const { data: user } = useUser();
  const createList = useCreateList();
  const deleteList = useDeleteList();
  const { trigger } = useHaptic();
  
  const [isOffline, setIsOffline] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');

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
    setIsCreateModalOpen(true);
  };

  const submitCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListTitle.trim()) return;

    createList.mutate({
      title: newListTitle,
      color_theme: 'indigo',
    }, {
      onSuccess: () => {
        setIsCreateModalOpen(false);
        setNewListTitle('');
      }
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
      {/* Header Simplificado */}
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Minhas Listas</h1>
          <p className="text-sm text-zinc-500">Organize suas compras colaborativas</p>
        </div>
        
        {isOffline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium">
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </div>
        )}
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
          <div className="glass-panel rounded-2xl p-6 h-40 flex flex-col items-center justify-center border-red-500/20 gap-2">
            <span className="text-red-400 text-sm text-center">
              Erro ao carregar listas.
            </span>
            <span className="text-zinc-500 text-xs text-center px-4">
              {(error as any)?.message || 'Infinite recursion detected in policy'}
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
                    <span className="text-2xl">{list.icon || '🛒'}</span>
                    <h3 className="font-medium text-lg truncate max-w-[200px]">{list.title}</h3>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-zinc-500">
                  <span>Atualizado {new Date(list.updated_at).toLocaleDateString()}</span>
                  <div className="flex -space-x-2">
                    <div className="w-6 h-6 rounded-full bg-zinc-800 border border-zinc-900 flex items-center justify-center text-[10px] font-bold">
                      {list.owner_id === user?.id ? 'EU' : 'CL'}
                    </div>
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

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Nova Lista</h2>
            <p className="text-zinc-400 text-sm mb-6">Dê um nome para sua nova lista de compras.</p>

            <form onSubmit={submitCreateList} className="flex flex-col gap-4">
              <input 
                type="text" 
                placeholder="Ex: Mercado da Semana, Churrasco..." 
                required
                autoFocus
                value={newListTitle}
                onChange={(e) => setNewListTitle(e.target.value)}
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button 
                type="submit" 
                disabled={createList.isPending || !newListTitle.trim()}
                className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {createList.isPending ? 'Criando...' : 'Criar Lista'}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
