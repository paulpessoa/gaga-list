'use client';

import { X, Check, ShoppingBag, Zap, Save, Plus } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';

interface ScannedProductModalProps {
  data: {
    name: string;
    brand: string;
    category: string;
    benefits: string;
    suggested_uses: string[];
  } | null;
  onClose: () => void;
  onSaveToMyProducts: () => void;
  onAddToList: () => void;
  isSaving: boolean;
}

export function ScannedProductModal({ data, onClose, onSaveToMyProducts, onAddToList, isSaving }: ScannedProductModalProps) {
  const { trigger } = useHaptic();

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto scrollbar-hide">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-4">
            <ShoppingBag className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">{data.name}</h2>
          <p className="text-indigo-500 font-bold text-xs uppercase tracking-widest mt-1">{data.brand || 'Marca não identificada'}</p>
        </div>

        <div className="space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-5 border border-zinc-100 dark:border-white/5">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-amber-500" /> Benefícios & Dicas
            </h3>
            <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed font-medium">
              {data.benefits}
            </p>
          </div>

          <div>
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-3 ml-1">Sugestões de Uso</h3>
            <div className="flex flex-wrap gap-2">
              {data.suggested_uses.map((use, i) => (
                <span key={i} className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-lg text-xs font-bold text-zinc-500 dark:text-zinc-400 border border-zinc-200 dark:border-white/5">
                  {use}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3">
          <button
            onClick={() => {
              trigger('medium');
              onAddToList();
            }}
            disabled={isSaving}
            className="w-full py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> Adicionar à Lista Atual
          </button>
          
          <button
            onClick={() => {
              trigger('light');
              onSaveToMyProducts();
            }}
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
