"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { MyProductsService, MyProduct } from "@/services/my-products.service"
import { 
  ShoppingBag, 
  Search, 
  Trash2, 
  Loader2, 
  ChevronRight, 
  Plus,
  Zap,
  Tag,
  ArrowLeft,
  UtensilsCrossed
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useHaptic } from "@/hooks/use-haptic"

export default function MyProductsPage() {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  const [products, setProducts] = useState<MyProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchSearchQuery] = useState("")

  const fetchProducts = useCallback(async () => {
    try {
      const data = await MyProductsService.getProducts(supabase)
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user, fetchProducts])

  const handleDelete = async (id: string) => {
    if (confirm("Remover este produto do seu catálogo?")) {
      trigger("medium")
      try {
        await MyProductsService.deleteProduct(supabase, id)
        setProducts(prev => prev.filter(p => p.id !== id))
      } catch (err) {
        alert("Erro ao deletar produto.")
      }
    }
  }

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                Meus Produtos
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                Seu catálogo inteligente ({products.length} itens)
              </p>
            </div>
          </div>
          
          <Link 
            href="/dashboard/recipes"
            className="flex items-center gap-2 px-4 py-2.5 bg-indigo-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            <UtensilsCrossed className="w-4 h-4" />
            Ver Receitas
          </Link>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou marca..."
            value={searchQuery}
            onChange={(e) => setSearchSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
          />
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">Carregando Catálogo...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center gap-6 border-dashed border-2">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">Seu catálogo está vazio</h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Use o AI Scanner no menu inferior para identificar produtos e salvá-los aqui.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => (
            <div 
              key={product.id}
              className="glass-panel p-5 rounded-[2rem] flex items-center gap-5 group hover:border-indigo-500/30 transition-all bg-white dark:bg-zinc-900/40"
            >
              <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shadow-inner shrink-0 relative overflow-hidden border border-zinc-200 dark:border-white/5">
                {product.image_url ? (
                  <Image src={product.image_url} fill className="object-cover" alt={product.name} />
                ) : (
                  <ShoppingBag className="w-7 h-7 text-indigo-500/40" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <h4 className="font-black text-zinc-900 dark:text-zinc-100 truncate leading-tight uppercase text-sm tracking-tight">
                  {product.name}
                </h4>
                <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-0.5">
                  {product.brand || "Marca Genérica"}
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500">
                    <Tag className="w-3 h-3" /> {product.category || "Geral"}
                  </span>
                </div>
              </div>

              <button 
                onClick={() => handleDelete(product.id)}
                className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Dica da IA */}
      <div className="mt-4 p-8 rounded-[2.5rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">Dica da Staff IA</h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
              Você tem {products.length} produtos. Que tal gerar uma receita com o que já tem em casa?
            </p>
            <Link 
              href="/dashboard/recipes"
              className="inline-flex items-center gap-1 text-indigo-500 font-black uppercase text-[9px] mt-2 hover:underline"
            >
              Ir para Receitas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
