'use client';

import { X, ShoppingBag, Zap, Save, Plus, Loader2, ListFilter } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';
import { useState } from 'react';

interface ScannedProductModalProps {
  data: {
    name: string;
    brand: string;
    category: string;
  } | null;
  lists: any[];
  activeListId: string | null;
  onClose: () => void;
  onSaveToMyProducts: (finalData: any) => void;
  onAddToList: (listId: string, finalData: any) => void;
  isSaving: boolean;
}

export function ScannedProductModal({ data, lists, activeListId, onClose, onSaveToMyProducts, onAddToList, isSaving }: ScannedProductModalProps) {
  const { trigger } = useHaptic();
  const [suggestions, setSuggestions] = useState<{ benefits: string, suggested_uses: string[] } | null>(null);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [selectedListId, setSelectedListId] = useState<string>(activeListId || '');

  if (!data) return null;

  const fetchSuggestions = async () => {
    setIsLoadingSuggestions(true);
    trigger('medium');
    try {
      const response = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productName: data.name, brand: data.brand, category: data.category })
      });
      const result = await response.json();
      setSuggestions(result);
      trigger('success' as any);
    } catch (err) {
      alert("Erro ao buscar sugestões.");
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2"><X className="w-6 h-6" /></button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-4"><ShoppingBag className="w-8 h-8 text-indigo-500" /></div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">{data.name}</h2>
          <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest mt-1">{data.brand || 'Marca não identificada'}</p>
        </div>

        <div className="space-y-6">
          {/* Seletor de Lista se não houver uma ativa */}
          {!activeListId && lists.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Adicionar à lista:</label>
              <select 
                value={selectedListId} 
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-3 px-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Selecione uma lista...</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          )}

          {suggestions ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> Benefícios</h3>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">{suggestions.benefits}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Sugestões de Uso</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.suggested_uses.map((use, i) => (
                    <span key={i} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">{use}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={fetchSuggestions}
              disabled={isLoadingSuggestions}
              className="w-full py-4 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group"
            >
              {isLoadingSuggestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-500 group-hover:text-white transition-colors" />}
              <span className="text-xs font-black uppercase tracking-widest">Ver Sugestões da IA</span>
            </button>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => onAddToList(selectedListId, { ...data, ...suggestions })}
            disabled={isSaving || !selectedListId}
            className="w-full py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Adicionar à Lista
          </button>
          
          <button
            onClick={() => onSaveToMyProducts({ ...data, ...suggestions })}
            disabled={isSaving}
            className="w-full py-4 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white border-2 border-zinc-100 dark:border-white/5 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4 text-emerald-500" /> Salvar em Meus Produtos
          </button>
        </div>
      </div>
    </div>
  );
}
