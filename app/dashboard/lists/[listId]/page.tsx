'use client';

import { use, useState } from 'react';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '@/hooks/use-items';
import { useLists, useCollaborators, useAddCollaborator, useRemoveCollaborator } from '@/hooks/use-lists';
import { Plus, CheckCircle2, Circle, Trash2, ArrowLeft, Share2, X, Users, ShoppingCart, Filter } from 'lucide-react';
import Link from 'next/link';
import { useHaptic } from '@/hooks/use-haptic';
import { useUser } from '@/hooks/use-user';

export default function ListDetail({ params }: { params: Promise<{ listId: string }> }) {
  const { listId } = use(params);
  const { data: lists } = useLists();
  const list = lists?.find(l => l.id === listId);
  const { data: user } = useUser();
  
  const { data: items, isLoading } = useItems(listId);
  const createItem = useCreateItem(listId);
  const updateItem = useUpdateItem(listId);
  const deleteItem = useDeleteItem(listId);
  const { trigger } = useHaptic();

  const [newItemName, setNewItemName] = useState('');
  const [filter, setFilter] = useState<'all' | 'pending' | 'purchased'>('all');

  // Share Modal State
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  
  const { data: collaborators } = useCollaborators(listId);
  const addCollaborator = useAddCollaborator(listId);
  const removeCollaborator = useRemoveCollaborator(listId);

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    trigger('medium');
    createItem.mutate({ name: newItemName });
    setNewItemName('');
  };

  const handleToggleItem = (item: any) => {
    trigger('light');
    updateItem.mutate({
      itemId: item.id,
      updates: { is_purchased: !item.is_purchased }
    });
  };

  const handleDeleteItem = (itemId: string) => {
    trigger('heavy');
    deleteItem.mutate(itemId);
  };

  const [showInviteButton, setShowInviteButton] = useState(false);

  const handleAddCollaborator = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collaboratorEmail.trim()) return;
    trigger('medium');
    setShowInviteButton(false);
    
    addCollaborator.mutate(collaboratorEmail, {
      onSuccess: () => {
        setShareMessage('Colaborador adicionado com sucesso!');
        setCollaboratorEmail('');
        setTimeout(() => setShareMessage(''), 3000);
      },
      onError: (error: any) => {
        if (error.message.includes('USUARIO_NAO_ENCONTRADO')) {
          setShareMessage('Este usuário ainda não possui conta na plataforma.');
          setShowInviteButton(true);
        } else {
          setShareMessage(`Erro: ${error.message}`);
          setTimeout(() => setShareMessage(''), 4000);
        }
      }
    });
  };

  const handleInviteUser = async () => {
    if (!collaboratorEmail.trim()) return;
    trigger('medium');
    setShareMessage('Enviando convite por e-mail...');
    
    try {
      const response = await fetch(`/api/lists/${listId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: collaboratorEmail, invite: true })
      });
      
      if (!response.ok) throw new Error('Erro ao enviar convite');
      
      setShareMessage('Convite enviado! O usuário receberá um e-mail para participar.');
      setCollaboratorEmail('');
      setShowInviteButton(false);
      setTimeout(() => setShareMessage(''), 5000);
    } catch (error: any) {
      setShareMessage(`Erro: ${error.message}`);
    }
  };

  const filteredItems = items?.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !item.is_purchased;
    if (filter === 'purchased') return item.is_purchased;
    return true;
  });

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-4xl mx-auto flex flex-col gap-8">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard" className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight">{list?.title || 'Lista'}</h1>
        </div>
        <button 
          onClick={() => setIsShareModalOpen(true)}
          className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
        >
          <Share2 className="w-5 h-5" />
        </button>
      </header>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="flex gap-2">
        <input 
          type="text" 
          placeholder="Adicionar novo item..." 
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          className="flex-1 bg-zinc-900/50 border border-white/10 rounded-2xl py-4 px-6 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
        <button 
          type="submit" 
          disabled={createItem.isPending || !newItemName.trim()}
          className="w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Plus className="w-6 h-6" />
        </button>
      </form>

      {/* Filters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'all' ? 'bg-white text-black' : 'bg-zinc-900/50 text-zinc-400 hover:text-white'}`}
        >
          Todos
        </button>
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'pending' ? 'bg-white text-black' : 'bg-zinc-900/50 text-zinc-400 hover:text-white'}`}
        >
          Pendentes
        </button>
        <button 
          onClick={() => setFilter('purchased')}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === 'purchased' ? 'bg-white text-black' : 'bg-zinc-900/50 text-zinc-400 hover:text-white'}`}
        >
          Comprados
        </button>
      </div>

      {/* Items List */}
      <div className="flex flex-col gap-2">
        {isLoading ? (
          <div className="glass-panel rounded-2xl p-6 h-24 animate-pulse flex items-center justify-center">
            <span className="text-zinc-500">Carregando itens...</span>
          </div>
        ) : filteredItems?.length === 0 ? (
          <div className="glass-panel rounded-2xl p-12 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-2">
              <ShoppingCart className="w-8 h-8 text-indigo-400 animate-bounce" />
            </div>
            <p className="text-zinc-400">Nenhum item encontrado.</p>
          </div>
        ) : (
          filteredItems?.map((item) => (
            <div 
              key={item.id} 
              className={`glass-panel rounded-2xl p-4 flex items-center justify-between group transition-all ${item.is_purchased ? 'opacity-50' : ''}`}
            >
              <div className="flex items-center gap-4 flex-1 cursor-pointer" onClick={() => handleToggleItem(item)}>
                <button className="text-zinc-400 hover:text-indigo-400 transition-colors">
                  {item.is_purchased ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6" />
                  )}
                </button>
                <div className="flex flex-col">
                  <span className={`font-medium ${item.is_purchased ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                    {item.name}
                  </span>
                  {(item.quantity > 1 || item.unit) && (
                    <span className="text-xs text-zinc-500">
                      {item.quantity} {item.unit || 'un'}
                    </span>
                  )}
                </div>
              </div>
              <button 
                onClick={() => handleDeleteItem(item.id)}
                disabled={deleteItem.isPending}
                className="p-2 text-zinc-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Share Modal */}
      {isShareModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setIsShareModalOpen(false)}
              className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <h2 className="text-2xl font-bold text-white mb-2">Compartilhar Lista</h2>
            <p className="text-zinc-400 text-sm mb-6">Convide amigos para editar esta lista com você.</p>

            <form onSubmit={handleAddCollaborator} className="flex gap-2 mb-6">
              <input 
                type="email" 
                placeholder="E-mail do colaborador" 
                required
                value={collaboratorEmail}
                onChange={(e) => setCollaboratorEmail(e.target.value)}
                className="flex-1 bg-zinc-900/50 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              />
              <button 
                type="submit" 
                disabled={addCollaborator.isPending || !collaboratorEmail.trim()}
                className="px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {addCollaborator.isPending ? 'Enviando...' : 'Convidar'}
              </button>
            </form>

            {shareMessage && (
              <div className={`p-4 rounded-xl text-sm mb-6 flex flex-col gap-3 ${shareMessage.includes('Erro') || shareMessage.includes('não possui conta') ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                <p>{shareMessage}</p>
                {showInviteButton && (
                  <button
                    onClick={handleInviteUser}
                    className="w-full py-2 px-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-medium transition-colors text-xs"
                  >
                    Enviar convite por e-mail
                  </button>
                )}
              </div>
            )}

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Colaboradores ({collaborators?.length || 0})
              </h3>
              
              <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-2">
                {collaborators?.length === 0 ? (
                  <p className="text-sm text-zinc-500 italic">Nenhum colaborador ainda.</p>
                ) : (
                  collaborators?.map((collab: any) => (
                    <div key={collab.profiles.id} className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/50 border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-medium text-sm">
                          {collab.profiles.email.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-zinc-200">{collab.profiles.full_name || collab.profiles.email.split('@')[0]}</span>
                          <span className="text-xs text-zinc-500">{collab.profiles.email}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-md bg-zinc-800 text-zinc-400">
                          {collab.role === 'owner' ? 'Dono' : 'Editor'}
                        </span>
                        {collab.role !== 'owner' && list?.owner_id === user?.id && (
                          <button
                            onClick={() => {
                              if (confirm('Remover colaborador?')) {
                                removeCollaborator.mutate(collab.profiles.id);
                              }
                            }}
                            className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
