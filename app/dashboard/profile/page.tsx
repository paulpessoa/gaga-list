'use client';

import { useUser } from '@/hooks/use-user';
import { ArrowLeft, User, Mail, Palette, Save } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useHaptic } from '@/hooks/use-haptic';

export default function ProfilePage() {
  const { data: user, isLoading } = useUser();
  const { trigger } = useHaptic();
  
  const [fullName, setFullName] = useState('');
  const [theme, setTheme] = useState('dark');
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user?.user_metadata?.full_name) {
      setFullName(user.user_metadata.full_name);
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');
    trigger('medium');

    try {
      // Em um cenário real, isso chamaria uma API route para atualizar o profile no Supabase
      // await fetch('/api/profile', { method: 'PUT', body: JSON.stringify({ full_name: fullName, theme_preference: theme }) });
      
      // Simulando delay
      await new Promise(resolve => setTimeout(resolve, 800));
      setMessage('Perfil atualizado com sucesso!');
    } catch (error) {
      setMessage('Erro ao atualizar perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>
      </header>

      {isLoading ? (
        <div className="glass-panel rounded-2xl p-8 animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-zinc-800/50"></div>
          <div className="w-48 h-6 bg-zinc-800/50 rounded-md"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-8 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/20 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center mb-8">
            <div className="w-24 h-24 rounded-full bg-indigo-500/20 flex items-center justify-center border-4 border-zinc-950 shadow-xl mb-4">
              <User className="w-10 h-10 text-indigo-400" />
            </div>
            <h2 className="text-xl font-medium text-zinc-100">{fullName || 'Usuário'}</h2>
            <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Nome Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                Tema Preferido
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setTheme('dark')}
                  className={`py-3 rounded-xl border transition-all ${theme === 'dark' ? 'bg-zinc-800 border-indigo-500 text-white' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800/50'}`}
                >
                  Escuro
                </button>
                <button
                  type="button"
                  onClick={() => setTheme('light')}
                  className={`py-3 rounded-xl border transition-all ${theme === 'light' ? 'bg-zinc-200 border-indigo-500 text-zinc-900' : 'bg-zinc-900/50 border-white/5 text-zinc-400 hover:bg-zinc-800/50'}`}
                >
                  Claro
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-3 rounded-xl text-sm text-center ${message.includes('Erro') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full py-3.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-8"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
