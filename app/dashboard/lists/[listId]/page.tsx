'use client';

import { use, useState } from 'react';
import { useItems, useCreateItem, useUpdateItem, useDeleteItem } from '@/hooks/use-items';
import { useLists, useCollaborators, useAddCollaborator, useRemoveCollaborator, useInviteUser } from '@/hooks/use-lists';
import { 
  Plus, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  ArrowLeft, 
  Share2, 
  ShoppingCart, 
  Navigation 
} from 'lucide-react';
import Link from 'next/link';
import { useHaptic } from '@/hooks/use-haptic';
import { useUser } from '@/hooks/use-user';
import { ShareModal } from '@/components/lists/share-modal';
import { Collaborator } from '@/types/database.types';

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
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  
  const { data: collaborators } = useCollaborators(listId);
  const addCollaborator = useAddCollaborator(listId);
  const removeCollaborator = useRemoveCollaborator(listId);
  const inviteUser = useInviteUser(listId);

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

  const filteredItems = items?.filter(item => {
    if (filter === 'all') return true;
    if (filter === 'pending') return !item.is_purchased;
    if (filter === 'purchased') return item.is_purchased;
    return true;
  });

  const isOwner = list?.owner_id === user?.id;

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
        <div className="flex items-center gap-2">
          <Link 
            href={`/dashboard/lists/${listId}/cade-tu`}
            className="flex items-center gap-2 py-2 px-4 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all font-medium text-sm group"
          >
            <Navigation className="w-4 h-4 group-hover:animate-pulse" />
            Cadê tu?
          </Link>
          <button 
            onClick={() => setIsShareModalOpen(true)}
            className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-white"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
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
        {(['all', 'pending', 'purchased'] as const).map((f) => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === f ? 'bg-white text-black' : 'bg-zinc-900/50 text-zinc-400 hover:text-white'}`}
          >
            {f === 'all' ? 'Todos' : f === 'pending' ? 'Pendentes' : 'Comprados'}
          </button>
        ))}
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

      <ShareModal 
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        listId={listId}
        collaborators={(collaborators || []) as Collaborator[]}
        isOwner={isOwner}
        currentUser={user}
        onAddCollaborator={(email, callbacks) => addCollaborator.mutate(email, callbacks)}
        onInviteUser={(email, callbacks) => inviteUser.mutate(email, callbacks)}
        onRemoveCollaborator={(userId) => removeCollaborator.mutate(userId)}
      />
    </main>
  );
}
