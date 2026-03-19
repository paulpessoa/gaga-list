'use client';

import { useUser } from '@/hooks/use-user';
import { ArrowLeft, User, Mail, Palette, Save, MapPin, Camera, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { useHaptic } from '@/hooks/use-haptic';
import { createClient } from '@/lib/supabase/client';

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useUser();
  const { trigger } = useHaptic();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [locationEnabled, setLocationEnabled] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (user) {
      setFullName(user.user_metadata?.full_name || '');
      // No MVP, buscamos do perfil público se existir
      const fetchProfile = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('avatar_url, location_enabled')
          .eq('id', user.id)
          .maybeSingle(); // Usar maybeSingle para evitar erro PGRST116
        
        if (data) {
          setAvatarUrl(data.avatar_url);
          setLocationEnabled(data.location_enabled);
        } else if (!error) {
          // Se não houver erro mas o dado for nulo, o perfil não existe.
          // Vamos criar um perfil básico para este usuário (Auto-Healing)
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email!,
            full_name: user.user_metadata?.full_name || '',
          });
        }
      };
      fetchProfile();
    }
  }, [user, supabase]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setIsUploading(true);
    trigger('light');

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      // Upload para o bucket 'avatars'
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Obter URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Adicionar timestamp para evitar cache do navegador na exibição imediata
      const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`;

      // Atualizar perfil
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrlWithTimestamp })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrlWithTimestamp);
      setMessage('Foto de perfil atualizada!');
    } catch (error: any) {
      setMessage(`Erro no upload: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage('');
    trigger('medium');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          full_name: fullName,
          location_enabled: locationEnabled
        })
        .eq('id', user.id);

      if (error) throw error;
      
      // Também atualizamos o metadata do auth para consistência
      await supabase.auth.updateUser({
        data: { full_name: fullName }
      });

      setMessage('Perfil atualizado com sucesso!');
    } catch (error: any) {
      setMessage(`Erro ao salvar: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-24">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight">Meu Perfil</h1>
      </header>

      {userLoading ? (
        <div className="glass-panel rounded-2xl p-8 animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-zinc-800/50"></div>
          <div className="w-48 h-6 bg-zinc-800/50 rounded-md"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-8 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden bg-zinc-950/40 backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center mb-10">
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900 flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-12 h-12 text-zinc-700" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full border-2 border-zinc-950 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleAvatarUpload} 
                className="hidden" 
                accept="image/*"
              />
            </div>
            <h2 className="text-xl font-medium text-zinc-100 mt-4">{fullName || 'Usuário'}</h2>
            <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-400">Nome Completo</label>
              <input 
                type="text" 
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Como quer ser chamado?"
                className="w-full bg-zinc-900/30 border border-white/10 rounded-2xl py-3.5 px-4 text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <label className="text-sm font-medium text-zinc-100 flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-indigo-400" />
                    Compartilhar Localização
                  </label>
                  <p className="text-xs text-zinc-500 max-w-[240px]">
                    Permitir que seus amigos de lista vejam onde você está no mapa do mercado.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationEnabled(!locationEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${locationEnabled ? 'bg-indigo-500' : 'bg-zinc-800'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${locationEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-sm text-center font-medium animate-in fade-in slide-in-from-top-2 ${message.includes('Erro') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                {message}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isSaving}
              className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white rounded-2xl font-semibold transition-all shadow-xl shadow-indigo-500/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
            >
              {isSaving ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Salvar Alterações
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}
