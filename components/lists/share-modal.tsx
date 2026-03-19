'use client';

import { useState } from 'react';
import { X, Users, Clock, Loader2, Bell, Phone, MessageSquare, Map as MapIcon, MessageCircleMore, QrCode } from 'lucide-react';
import { Collaborator } from '@/types/database.types';
import { usePresence } from '@/hooks/use-presence';
import { useHaptic } from '@/hooks/use-haptic';
import { formatPhoneForWhatsApp } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { QRCodeSVG } from 'qrcode.react';
import Link from 'next/link';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  listId: string;
  collaborators: Collaborator[];
  isOwner: boolean;
  currentUser: any;
  onAddCollaborator: (email: string, callbacks: { onSuccess: () => void; onError: (err: any) => void }) => void;
  onInviteUser: (email: string, callbacks: { onSuccess: () => void; onError: (err: any) => void }) => void;
  onRemoveCollaborator: (userId: string) => void;
  onOpenChat?: (targetUser: { id: string, full_name: string | null, avatar_url: string | null }) => void;
}

export function ShareModal({
  isOpen,
  onClose,
  listId,
  collaborators,
  isOwner,
  currentUser,
  onAddCollaborator,
  onInviteUser,
  onRemoveCollaborator,
  onOpenChat
}: ShareModalProps) {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [showInviteButton, setShowInviteButton] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  
  const supabase = createClient();
  const { onlineUsers, sendNudge } = usePresence(listId, currentUser);
  const { trigger } = useHaptic();

  if (!isOpen) return null;

  const handleNudge = (targetId: string) => {
    sendNudge(targetId);
  };

  const isOnline = (userId: string) => !!onlineUsers[userId];

  const handleGenerateInvite = async () => {
    setIsLoading(true);
    trigger('medium');
    try {
      const { data, error } = await (supabase
        .from('list_invite_tokens') as any)
        .insert({
          list_id: listId,
          created_by: currentUser.id
        })
        .select('id')
        .single();

      if (error) throw error;
      setInviteToken(data.id);
      setIsQrModalOpen(true);
    } catch (err) {
      console.error('Erro ao gerar convite:', err);
      alert('Erro ao gerar QR Code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setIsLoading(true);
    setShowInviteButton(false);
    
    onAddCollaborator(email, {
      onSuccess: () => {
        setMessage('Colaborador adicionado com sucesso!');
        setEmail('');
        setIsLoading(false);
        setTimeout(() => setMessage(''), 3000);
      },
      onError: (error: any) => {
        setIsLoading(false);
        if (error.message?.includes('USUARIO_NAO_ENCONTRADO')) {
          setMessage('Este usuário ainda não possui conta.');
          setShowInviteButton(true);
        } else {
          setMessage(`Erro: ${error.message}`);
        }
      }
    });
  };

  const handleInvite = () => {
    setIsLoading(true);
    onInviteUser(email, {
      onSuccess: () => {
        setMessage('Convite enviado!');
        setEmail('');
        setShowInviteButton(false);
        setIsLoading(false);
        setTimeout(() => setMessage(''), 5000);
      },
      onError: (error: any) => {
        setIsLoading(false);
        setMessage(`Erro: ${error.message}`);
      }
    });
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="glass-panel w-full max-w-md rounded-3xl p-6 sm:p-8 relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 overflow-y-auto max-h-[90vh]">
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <h2 className="text-2xl font-bold text-white mb-2 tracking-tight">Compartilhar</h2>
          <p className="text-zinc-400 text-sm mb-6">Traga sua equipe para as compras.</p>

          <div className="flex flex-col gap-4 mb-8">
            <button 
              onClick={handleGenerateInvite}
              disabled={isLoading}
              className="w-full py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-all active:scale-[0.98]"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><QrCode className="w-5 h-5" /> Convite via QR Code</>}
            </button>
            
            <div className="flex items-center gap-4 text-zinc-800">
              <div className="flex-1 h-px bg-current opacity-20" />
              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">ou por e-mail</span>
              <div className="flex-1 h-px bg-current opacity-20" />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 mb-6">
            <input 
              type="email" 
              placeholder="E-mail do colaborador" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl py-4 px-5 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <button 
              type="submit" 
              disabled={isLoading || !email.trim()}
              className="px-6 py-4 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 min-w-[120px] flex items-center justify-center"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Convidar'}
            </button>
          </form>

          {message && (
            <div className={`p-4 rounded-2xl text-xs font-bold mb-6 flex flex-col gap-3 ${message.includes('Erro') || message.includes('não possui') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
              <p>{message}</p>
              {showInviteButton && (
                <button
                  onClick={handleInvite}
                  className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-colors text-[10px] uppercase tracking-widest"
                >
                  Enviar convite por e-mail
                </button>
              )}
            </div>
          )}

          <div className="space-y-4">
            <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2">
              <Users className="w-3 h-3" />
              Colaboradores Ativos ({collaborators?.length || 0})
            </h3>
            
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 scrollbar-hide">
              {collaborators?.length === 0 ? (
                <p className="text-sm text-zinc-600 italic py-4">Nenhum colaborador ainda.</p>
              ) : (
                collaborators?.map((collab, index) => (
                  <div key={collab.user_id || collab.profiles?.id || `collab-${index}`} className="flex flex-col gap-3 p-4 rounded-3xl bg-zinc-900/40 border border-white/5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {collab.profiles?.avatar_url ? (
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-white/10 shadow-lg">
                            <img src={collab.profiles.avatar_url} alt={collab.profiles.full_name || 'Avatar'} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${collab.status === 'pending' ? 'bg-zinc-800 text-zinc-600' : 'bg-indigo-500/20 text-indigo-400'}`}>
                            {(collab.profiles?.email || 'U').charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-bold ${collab.status === 'pending' ? 'text-zinc-600' : 'text-zinc-100'}`}>
                              {collab.profiles?.full_name || collab.profiles?.email?.split('@')[0] || 'Usuário'}
                            </span>
                            {isOnline(collab.profiles?.id) && (
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            )}
                          </div>
                          <span className="text-[10px] text-zinc-600 font-medium">{collab.profiles?.email}</span>
                        </div>
                      </div>

                      {collab.role !== 'owner' && isOwner && (
                        <button
                          onClick={() => {
                            const idToRemove = collab.status === 'pending' 
                              ? `pending-${collab.profiles?.email}` 
                              : (collab.user_id || collab.profiles?.id);
                            
                            if (idToRemove && confirm(`Remover colaborador?`)) {
                              onRemoveCollaborator(idToRemove);
                            }
                          }}
                          className="p-2 text-zinc-700 hover:text-red-400 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* Action Bar - Reestilizada para Mobile */}
                    {collab.status === 'active' && collab.profiles?.id !== currentUser?.id && (
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          onClick={() => handleNudge(collab.profiles.id)}
                          disabled={!isOnline(collab.profiles.id)}
                          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-950/50 border border-white/5 text-zinc-500 hover:text-amber-400 disabled:opacity-20 transition-all"
                        >
                          <Bell className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase">Sino</span>
                        </button>
                        
                        {collab.profiles?.phone ? (
                          <a
                            href={`https://wa.me/${formatPhoneForWhatsApp(collab.profiles.phone)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all"
                            onClick={() => trigger('light')}
                          >
                            <MessageCircleMore className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase">Zap</span>
                          </a>
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-950/50 border border-white/5 text-zinc-800 opacity-30 cursor-not-allowed">
                            <MessageCircleMore className="w-4 h-4" />
                            <span className="text-[8px] font-bold uppercase">Zap</span>
                          </div>
                        )}

                        <button
                          onClick={() => {
                            onClose();
                            trigger('light');
                            onOpenChat?.({
                              id: (collab.profiles?.id || collab.user_id) as string,
                              full_name: collab.profiles?.full_name || collab.profiles?.email || 'Usuário',
                              avatar_url: collab.profiles?.avatar_url || null
                            });
                          }}
                          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-950/50 border border-white/5 text-zinc-500 hover:text-indigo-400 transition-all"
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase">Chat</span>
                        </button>

                        <Link
                          href={`/dashboard/lists/${listId}/cade-tu`}
                          className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl bg-zinc-950/50 border border-white/5 text-zinc-500 hover:text-indigo-400 transition-all"
                        >
                          <MapIcon className="w-4 h-4" />
                          <span className="text-[8px] font-bold uppercase">Mapa</span>
                        </Link>
                      </div>
                    )}
                  </div>
                ) )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      {isQrModalOpen && inviteToken && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass-panel w-full max-w-sm rounded-[2.5rem] p-10 flex flex-col items-center text-center relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-8 right-8 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6">
              <QrCode className="w-8 h-8 text-indigo-400" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">Escaneie para entrar</h2>
            <p className="text-zinc-500 text-xs mb-8">Aponte a câmera para entrar na lista.</p>

            <div className="p-6 bg-white rounded-3xl shadow-2xl mb-8">
              <QRCodeSVG 
                value={`${window.location.origin}/join/${inviteToken}`}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <p className="text-[10px] font-bold text-amber-500 uppercase tracking-widest">Válido por 24 horas</p>
            
            <button 
              onClick={() => setIsQrModalOpen(false)}
              className="mt-8 w-full py-4 bg-zinc-900 text-white rounded-2xl font-bold transition-all active:scale-95"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  );
}
