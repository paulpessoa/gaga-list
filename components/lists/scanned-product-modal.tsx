'use client';

import { X, ShoppingBag, Zap, Save, Plus, Loader2, ListFilter, Coins } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';
import { useState } from 'react';
import { formatPriceMask, parsePriceFromMask } from '@/lib/utils';

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
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState(0);

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
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#1c1b1b] w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-[#3d4a3d]/60 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2"><X className="w-6 h-6" /></button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-4"><ShoppingBag className="w-8 h-8 text-indigo-500" /></div>
          <h2 className="text-2xl font-black text-[#e5e2e1] tracking-tight leading-tight">{data.name}</h2>
          <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest mt-1">{data.brand || 'Marca não identificada'}</p>
        </div>

        <div className="space-y-6">
          {/* Seletor de Lista se não houver uma ativa */}
          {!activeListId && lists.length > 0 && (
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Adicionar à lista:</label>
              <select 
                value={selectedListId} 
                onChange={(e) => setSelectedListId(e.target.value)}
                className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-bold text-[#e5e2e1] focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option value="">Selecione uma lista...</option>
                {lists.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
              </select>
            </div>
          )}

          {/* Inputs de Quantidade e Preço */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Quantidade</label>
              <input 
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-bold text-[#e5e2e1] outline-none shadow-inner"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-600 ml-1">Preço Unitário</label>
              <div className="relative">
                <input 
                  type="text"
                  inputMode="numeric"
                  placeholder="0,00"
                  value={price > 0 ? formatPriceMask(Math.round(price * 100).toString()) : ""}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/\D/g, "");
                    setPrice(parsePriceFromMask(rawValue));
                  }}
                  className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 pl-10 px-4 text-sm font-bold text-[#e5e2e1] outline-none shadow-inner"
                />
                <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>

          {suggestions ? (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
              <div className="bg-[#131313] rounded-2xl p-5 border border-[#3d4a3d]/40">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-2 flex items-center gap-2"><Zap className="w-3.5 h-3.5 text-amber-500" /> Benefícios</h3>
                <p className="text-sm text-zinc-500 leading-relaxed font-medium">{suggestions.benefits}</p>
              </div>
              <div>
                <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-600 mb-3 ml-1">Sugestões de Uso</h3>
                <div className="flex flex-wrap gap-2">
                  {suggestions.suggested_uses.map((use, i) => (
                    <span key={i} className="px-3 py-1.5 bg-[#131313] border border-[#3d4a3d]/40 rounded-lg text-xs font-bold text-zinc-500">{use}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <button 
              onClick={fetchSuggestions}
              disabled={isLoadingSuggestions}
              className="w-full py-4 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl flex items-center justify-center gap-3 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group shadow-sm shadow-indigo-500/5"
            >
              {isLoadingSuggestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-amber-500 group-hover:text-white transition-colors" />}
              <span className="text-xs font-black uppercase tracking-widest">Ver Sugestões da IA</span>
            </button>
          )}
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => onAddToList(selectedListId, { ...data, ...suggestions, quantity, price })}
            disabled={isSaving || !selectedListId}
            className="w-full py-4.5 bg-[#1DB954] hover:bg-[#53E076] text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-[#53E076]/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />} Adicionar à Lista
          </button>
          
          <button
            onClick={() => onSaveToMyProducts({ ...data, ...suggestions, price })}
            disabled={isSaving}
            className="w-full py-4 bg-[#201f1f] text-[#e5e2e1] border border-[#3d4a3d]/60 rounded-2xl font-bold text-[10px] uppercase tracking-widest hover:bg-[#2a2a2a] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-inner"
          >
            <Save className="w-4 h-4 text-emerald-500" /> Salvar em Meus Produtos
          </button>
        </div>
      </div>
    </div>
  );
}
