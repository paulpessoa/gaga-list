'use client';

import { X, Save, Loader2, Tag, Package, Hash, Ruler, Coins } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';
import { useState } from 'react';
import { MyProduct, InsertProduct } from '@/services/my-products.service';
import { formatPriceMask, parsePriceFromMask } from '@/lib/utils';

interface CreateProductModalProps {
  onClose: () => void;
  onSave: (product: InsertProduct) => Promise<void>;
  isSaving: boolean;
}

export function CreateProductModal({ onClose, onSave, isSaving }: CreateProductModalProps) {
  const { trigger } = useHaptic();
  const [formData, setFormData] = useState<Partial<InsertProduct>>({
    name: '',
    brand: '',
    category: 'Geral',
    default_unit: 'un',
    default_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;
    
    trigger('medium');
    await onSave(formData as InsertProduct);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-3xl flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-indigo-500" />
          </div>
          <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight leading-tight">
            Novo Produto
          </h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">
            Cadastre no seu catálogo pessoal
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Nome do Produto *</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Ex: Arroz Integral"
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Marca</label>
              <div className="relative">
                <Hash className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input 
                  value={formData.brand || ''}
                  onChange={e => setFormData(prev => ({ ...prev, brand: e.target.value }))}
                  placeholder="Ex: Tio João"
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Unidade Padrão</label>
              <div className="relative">
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <select 
                  value={formData.default_unit || 'un'}
                  onChange={e => setFormData(prev => ({ ...prev, default_unit: e.target.value }))}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
                >
                  <option value="un">UN</option>
                  <option value="kg">KG</option>
                  <option value="g">G</option>
                  <option value="L">L</option>
                  <option value="ml">ML</option>
                  <option value="pct">PCT</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Categoria</label>
            <div className="relative">
              <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <select 
                value={formData.category || 'Geral'}
                onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all appearance-none"
              >
                <option value="Geral">Geral</option>
                <option value="Mercearia">Mercearia</option>
                <option value="Hortifruti">Hortifruti</option>
                <option value="Laticínios">Laticínios</option>
                <option value="Açougue">Açougue</option>
                <option value="Limpeza">Limpeza</option>
                <option value="Higiene">Higiene</option>
                <option value="Bebidas">Bebidas</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 ml-1">Preço Médio Estimado</label>
            <div className="relative">
              <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
              <input 
                type="text"
                inputMode="numeric"
                value={(formData as any).price > 0 ? formatPriceMask(Math.round((formData as any).price * 100).toString()) : ""}
                onChange={e => {
                  const rawValue = e.target.value.replace(/\D/g, "");
                  const numericValue = parsePriceFromMask(rawValue);
                  setFormData(prev => ({ ...prev, price: numericValue } as any));
                }}
                placeholder="R$ 0,00"
                className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving || !formData.name}
            className="w-full mt-6 py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />} 
            Salvar Produto
          </button>
        </form>
      </div>
    </div>
  );
}
