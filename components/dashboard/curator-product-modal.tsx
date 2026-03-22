'use client';

import { X, CheckCircle, Loader2, Tag, Package, Ruler, Globe } from 'lucide-react';
import { useHaptic } from '@/hooks/use-haptic';
import { useState } from 'react';
import { MyProduct } from '@/services/my-products.service';

interface CuratorProductModalProps {
  product: any;
  onClose: () => void;
  onPromote: (updatedProduct: Partial<MyProduct>) => Promise<void>;
  isPromoting: boolean;
}

export function CuratorProductModal({ product, onClose, onPromote, isPromoting }: CuratorProductModalProps) {
  const { trigger } = useHaptic();
  const [formData, setFormData] = useState<Partial<MyProduct>>({
    name: product.name,
    brand: product.brand,
    category: product.category || 'Geral',
    default_unit: product.default_unit || 'un',
    image_url: product.image_url
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    trigger('success' as any);
    await onPromote(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-8 relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200 text-white">
        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-zinc-500 hover:text-white p-2 transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-3xl flex items-center justify-center mb-4">
            <Globe className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black tracking-tight leading-tight">
            Curadoria de Produto
          </h2>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mt-1">
            Promover para o Catálogo Global
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Nome Oficial *</label>
            <div className="relative">
              <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                required
                value={formData.name}
                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Unidade Padrão</label>
              <div className="relative">
                <Ruler className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select 
                  value={formData.default_unit || 'un'}
                  onChange={e => setFormData(prev => ({ ...prev, default_unit: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
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
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-1">Categoria</label>
              <div className="relative">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <select 
                  value={formData.category || 'Geral'}
                  onChange={e => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all appearance-none"
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
          </div>

          <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl">
             <p className="text-[10px] text-emerald-400 font-medium leading-relaxed">
               Ao promover, este produto ficará disponível para todos os usuários como uma sugestão oficial do sistema.
             </p>
          </div>

          <button
            type="submit"
            disabled={isPromoting}
            className="w-full mt-6 py-4.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPromoting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle className="w-5 h-5" />} 
            Confirmar Promoção
          </button>
        </form>
      </div>
    </div>
  );
}
