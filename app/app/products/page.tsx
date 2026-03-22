"use client"

import { useState, useEffect, useCallback } from "react"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { MyProductsService, MyProduct, InsertProduct } from "@/services/my-products.service"
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
  UtensilsCrossed,
  Filter,
  User
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useHaptic } from "@/hooks/use-haptic"
import { CreateProductModal } from "@/components/lists/create-product-modal"

export default function MyProductsPage() {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  const [products, setProducts] = useState<MyProduct[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewMode, setViewMode] = useState<"all" | "mine">("all")
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const fetchProducts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = viewMode === "all" 
        ? await MyProductsService.getProducts(supabase)
        : await MyProductsService.getMyRegisteredProducts(supabase)
      setProducts(data)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, viewMode])

  useEffect(() => {
    if (user) {
      fetchProducts()
    }
  }, [user, fetchProducts])

  const handleSaveProduct = async (product: InsertProduct) => {
    if (!user) return
    setIsSaving(true)
    try {
      await MyProductsService.addProduct(supabase, {
        ...product,
        user_id: user.id
      })
      await fetchProducts()
      trigger("success" as any)
    } catch (err) {
      alert("Erro ao salvar produto.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    // Apenas produtos do catálogo (my_products) podem ser deletados aqui.
    // Itens que vêm do histórico de listas são virtuais (id começa com item-)
    if (id.startsWith('item-')) {
      alert("Este item faz parte do seu histórico de listas e não pode ser removido daqui.")
      return
    }

    if (confirm("Remover este produto do seu catálogo?")) {
      trigger("medium")
      try {
        await MyProductsService.deleteProduct(supabase, id)
        setProducts((prev) => prev.filter((p) => p.id !== id))
      } catch (err) {
        alert("Erro ao deletar produto.")
      }
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
                Meu Inventário
              </h1>
              <p className="text-sm text-zinc-500 font-medium">
                {viewMode === 'all' ? 'Tudo o que você já comprou ou escaneou' : 'Produtos cadastrados por você'} ({products.length} itens)
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsModalOpen(true)}
              className="p-2.5 rounded-xl bg-indigo-500 text-white hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20 active:scale-95 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                Novo Produto
              </span>
            </button>
            <Link
              href="/app/recipes"
              onClick={() => trigger("light")}
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95 flex items-center gap-2"
            >
              <UtensilsCrossed className="w-4 h-4" />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">
                Receitas
              </span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
            <input
              type="text"
              placeholder="Buscar no seu histórico..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-inner"
            />
          </div>

          <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1.5 rounded-2xl border border-zinc-200 dark:border-white/5 self-start sm:self-auto">
            <button
              onClick={() => { setViewMode('all'); trigger('light'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'all' ? 'bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <Filter className="w-3.5 h-3.5" />
              Tudo
            </button>
            <button
              onClick={() => { setViewMode('mine'); trigger('light'); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'mine' ? 'bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-white'}`}
            >
              <User className="w-3.5 h-3.5" />
              Meus Cadastros
            </button>
          </div>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
            Sincronizando Inventário...
          </p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="glass-panel rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center gap-6 border-dashed border-2">
          <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
              Nenhum item encontrado
            </h3>
            <p className="text-zinc-500 text-sm max-w-xs mx-auto">
              Comece a adicionar itens às suas listas ou use o AI Scanner para
              popular seu inventário.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProducts.map((product) => {
            const isFromHistory = product.id.startsWith('item-')
            
            return (
              <div
                key={product.id}
                className={`glass-panel p-5 rounded-[2rem] flex items-center gap-5 group hover:border-indigo-500/30 transition-all ${isFromHistory ? 'bg-zinc-50/50 dark:bg-zinc-900/20' : 'bg-white dark:bg-zinc-900/40'}`}
              >
                <div className="w-16 h-16 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-2xl shadow-inner shrink-0 relative overflow-hidden border border-zinc-200 dark:border-white/5">
                  {product.image_url ? (
                    <Image
                      src={product.image_url}
                      fill
                      className="object-cover"
                      alt={product.name}
                    />
                  ) : (
                    <ShoppingBag className={`w-7 h-7 ${isFromHistory ? 'text-zinc-400/40' : 'text-indigo-500/40'}`} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="font-black text-zinc-900 dark:text-zinc-100 truncate leading-tight uppercase text-sm tracking-tight">
                    {product.name}
                  </h4>
                  <p className={`text-xs font-bold uppercase tracking-widest mt-0.5 ${isFromHistory ? 'text-zinc-400' : 'text-indigo-500'}`}>
                    {product.brand || (isFromHistory ? "Do Histórico" : "Marca Genérica")}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded-md text-zinc-500">
                      <Tag className="w-3 h-3" /> {product.category || "Geral"}
                    </span>
                  </div>
                </div>

                {!isFromHistory && (
                  <button
                    onClick={() => handleDelete(product.id)}
                    className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 shadow-sm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Dica da IA */}
      <div className="mt-4 p-8 rounded-[2.5rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500 flex items-center justify-center shrink-0 shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-1">
              Dica da Staff IA
            </h4>
            <p className="text-[11px] text-zinc-600 dark:text-zinc-400 font-medium leading-relaxed">
              Você tem {products.length} produtos. Que tal gerar uma receita com
              o que já tem em casa?
            </p>
            <Link
              href="/app/recipes"
              className="inline-flex items-center gap-1 text-indigo-500 font-black uppercase text-[9px] mt-2 hover:underline"
            >
              Ir para Receitas <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <CreateProductModal 
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveProduct}
          isSaving={isSaving}
        />
      )}
    </main>
  )
}
