"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { useLists } from "@/hooks/use-lists"
import { useHaptic } from "@/hooks/use-haptic"
import { createClient } from "@/lib/supabase/client"
import { MyProductsService, MyProduct } from "@/services/my-products.service"
import {
  UtensilsCrossed,
  ChefHat,
  Loader2,
  Clock,
  Wand2,
  ChevronRight,
  BookOpen,
  ShoppingBag,
  Search,
  Check,
  X,
  Trash2,
  Zap,
  ArrowLeft,
  Plus,
  Sparkles,
  Info,
  CheckCircle2
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Drawer } from "vaul"
import { motion, AnimatePresence } from "framer-motion"

export default function RecipesPage() {
  const { data: lists } = useLists()
  const { trigger } = useHaptic()
  const router = useRouter()
  const supabase = createClient()

  // Refs para scroll
  const resultsRef = useRef<HTMLDivElement>(null)

  // Estados de Input
  const [selectedListId, setSelectedListId] = useState("")
  const [customQuery, setCustomQuery] = useState("")
  const [myProducts, setMyProducts] = useState<MyProduct[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [searchProduct, setSearchProduct] = useState("")

  // Estados de Resultado
  const [recipes, setRecipes] = useState<any[]>([])
  const [savedRecipes, setSavedRecipes] = useState<any[]>([])
  const [viewingRecipe, setViewingRecipe] = useState<any>(null)

  // Estados de Loading e Status
  const [loadingStatus, setLoadingStatus] = useState("")
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const [isLoadingProducts, setIsLoadingProducts] = useState(false)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)

  const fetchSavedRecipes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false })
      if (!error) setSavedRecipes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoadingSaved(false)
    }
  }, [supabase])

  const fetchMyProducts = useCallback(async () => {
    try {
      const data = await MyProductsService.getProducts(supabase)
      setMyProducts(data)
    } catch (err) {
      console.error(err)
    }
  }, [supabase])

  useEffect(() => {
    fetchSavedRecipes()
    fetchMyProducts()
  }, [fetchSavedRecipes, fetchMyProducts])

  const generateRecipes = async (
    type: "from_list" | "custom" | "from_products"
  ) => {
    if (type === "from_list") setIsLoadingList(true)
    else if (type === "custom") setIsLoadingCustom(true)
    else setIsLoadingProducts(true)

    setLoadingStatus(
      type === "from_products"
        ? "Chef IA analisando seu catálogo..."
        : type === "from_list"
          ? "Consultando sua lista de compras..."
          : "Preparando sugestões criativas..."
    )

    trigger("medium")
    try {
      let items: string[] = []

      if (type === "from_list") {
        const response = await fetch(`/api/lists/${selectedListId}/items`)
        const result = await response.json()
        const listItems = result.data || []
        if (listItems.length === 0) {
          alert(
            "Sua lista está vazia! Adicione alguns ingredientes antes de pedir sugestões."
          )
          return
        }
        items = listItems.map((i: any) => i.name)
      } else if (type === "from_products") {
        if (selectedProducts.length === 0) {
          alert("Selecione pelo menos um produto do seu catálogo.")
          return
        }
        items = myProducts
          .filter((p) => selectedProducts.includes(p.id))
          .map((p) => `${p.name} ${p.brand ? `(${p.brand})` : ""}`)
      } else {
        items = [customQuery]
      }

      setLoadingStatus("Gourmetizando com Gemini...")
      const response = await fetch("/api/ai/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, type })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro na IA")

      setRecipes(data.recipes || [])
      trigger("success" as any)

      // Scroll suave para os resultados
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        })
      }, 100)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsLoadingList(false)
      setIsLoadingCustom(false)
      setIsLoadingProducts(false)
      setLoadingStatus("")
    }
  }

  const createListFromRecipe = async (recipe: any) => {
    trigger("medium")
    try {
      const response = await fetch("/api/lists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: `Ingredientes: ${recipe.title}` })
      })
      const result = await response.json()
      const newList = result.data

      if (!newList?.id) throw new Error("Falha ao criar lista")

      for (const ingredient of recipe.ingredients) {
        await fetch(`/api/lists/${newList.id}/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: ingredient.name,
            quantity: ingredient.quantity || "1"
          })
        })
      }
      trigger("success" as any)
      router.push(`/app/lists/${newList.id}`)
    } catch (err) {
      alert("Erro ao criar lista.")
    }
  }

  const saveRecipe = async (recipe: any) => {
    trigger("medium")
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase.from("recipes").insert({
        user_id: userData.user.id,
        title: recipe.title,
        description: recipe.description,
        ingredients: recipe.ingredients,
        instructions: recipe.instructions,
        prep_time: recipe.prep_time,
        difficulty: recipe.difficulty,
        ai_metadata: { saved_at: new Date().toISOString() }
      })

      if (error) throw error
      trigger("success" as any)
      fetchSavedRecipes()
    } catch (err) {
      alert("Erro ao salvar receita.")
    }
  }

  const deleteSavedRecipe = async (id: string) => {
    if (!confirm("Excluir esta receita salva?")) return
    trigger("medium")
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", id)
      if (error) throw error
      setSavedRecipes((prev) => prev.filter((r) => r.id !== id))
      setViewingRecipe(null)
      trigger("success" as any)
    } catch (err) {
      alert("Erro ao excluir receita.")
    }
  }

  const toggleProduct = (id: string) => {
    setSelectedProducts((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    )
  }

  const filteredProducts = myProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(searchProduct.toLowerCase()) ||
      p.brand?.toLowerCase().includes(searchProduct.toLowerCase())
  )

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-center gap-4">
        <Link 
          href="/app" 
          onClick={() => trigger('light')}
          className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-indigo-500 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex flex-col">
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Receitas Inteligentes
          </h1>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest opacity-70">Cozinha com IA</p>
        </div>
      </header>

      {/* Grid de Ferramentas IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sugerir da Lista */}
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-indigo-500/5 border-2 border-indigo-500/10 hover:border-indigo-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-500">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <h2 className="font-black uppercase tracking-widest text-[10px]">Sugerir da Lista</h2>
            </div>
            <div className="px-2 py-1 bg-indigo-500/10 rounded-lg">
               <span className="text-[8px] font-black text-indigo-500 uppercase">1 Grão</span>
            </div>
          </div>
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
          >
            <option value="">Escolha uma lista...</option>
            {lists?.map((l) => (
              <option key={l.id} value={l.id}>{l.title}</option>
            ))}
          </select>
          <button 
            onClick={() => generateRecipes('from_list')}
            disabled={!selectedListId || isLoadingList}
            className="w-full py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingList ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Gerar Sugestões"}
          </button>
        </div>

        {/* Buscar Específica */}
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-rose-500/5 border-2 border-rose-500/10 hover:border-rose-500/20 transition-all">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-rose-500">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <h2 className="font-black uppercase tracking-widest text-[10px]">Busca Específica</h2>
            </div>
            <div className="px-2 py-1 bg-rose-500/10 rounded-lg">
               <span className="text-[8px] font-black text-rose-500 uppercase">1 Grão</span>
            </div>
          </div>
          <input
            type="text"
            placeholder="Ex: Almoço rápido com frango..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none shadow-inner"
          />
          <button
            onClick={() => generateRecipes("custom")}
            disabled={!customQuery || isLoadingCustom}
            className="w-full py-4.5 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-rose-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingCustom ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Consultar Chef"}
          </button>
        </div>

        {/* Meus Produtos Selecionáveis */}
        <div className="md:col-span-2 glass-panel p-8 rounded-[3rem] flex flex-col gap-6 bg-emerald-500/5 border-2 border-emerald-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
            <ShoppingBag className="w-40 h-40 text-emerald-500" />
          </div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3 text-emerald-500">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <h2 className="font-black uppercase tracking-widest text-[10px]">Receita do Meu Inventário</h2>
            </div>
            <div className="flex items-center gap-3">
              {selectedProducts.length > 0 && (
                <button onClick={() => setSelectedProducts([])} className="text-[9px] font-black uppercase text-zinc-400 hover:text-rose-500">Limpar ({selectedProducts.length})</button>
              )}
              <div className="px-2 py-1 bg-emerald-500/10 rounded-lg">
                 <span className="text-[8px] font-black text-emerald-500 uppercase">1 Grão</span>
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Pesquisar nos meus produtos salvos..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl py-3.5 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-inner"
            />
          </div>

          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto p-1 custom-scrollbar relative z-10">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                className={`flex items-center gap-2 px-4 py-3 rounded-2xl border-2 text-[10px] font-black uppercase transition-all active:scale-95 ${selectedProducts.includes(p.id) ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-500 hover:border-emerald-500/30"}`}
              >
                {selectedProducts.includes(p.id) ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                {p.name}
              </button>
            ))}
            {myProducts.length === 0 && (
              <Link href="/app/products" className="text-[10px] font-bold text-zinc-400 py-8 w-full text-center hover:text-emerald-500 underline">Você ainda não tem produtos salvos. Scaneie produtos para começar.</Link>
            )}
          </div>

          <button
            onClick={() => generateRecipes("from_products")}
            disabled={selectedProducts.length === 0 || isLoadingProducts}
            className="relative z-10 w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-emerald-500/30 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingProducts ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : `Criar Receita com ${selectedProducts.length} itens`}
          </button>
        </div>
      </div>

      {/* Status de Carregamento IA (Feedback Visual) */}
      {loadingStatus && (
        <div className="flex flex-col items-center justify-center py-12 gap-4 animate-in fade-in duration-500">
          <div className="w-20 h-20 bg-indigo-500/10 rounded-[2rem] flex items-center justify-center border-2 border-indigo-500/20 animate-pulse">
            <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
          </div>
          <p className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">{loadingStatus}</p>
        </div>
      )}

      {/* Resultados da IA Atual */}
      <div ref={resultsRef} className="scroll-mt-10">
        <AnimatePresence>
          {recipes.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="flex items-center gap-2 px-2">
                <Wand2 className="w-4 h-4 text-indigo-500" />
                <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Sugestões Especiais</h2>
              </div>
              {recipes.map((recipe, idx) => (
                <div key={idx} className="glass-panel p-10 rounded-[3.5rem] bg-white dark:bg-zinc-900/40 border-2 border-indigo-500/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700">
                     <ChefHat className="w-64 h-64 text-indigo-500" />
                  </div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest border border-indigo-500/10">{recipe.difficulty}</span>
                        <div className="flex items-center gap-1.5 text-zinc-400 text-[9px] font-black uppercase tracking-widest">
                          <Clock className="w-3.5 h-3.5" /> {recipe.prep_time}
                        </div>
                      </div>
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">{recipe.title}</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10 max-w-2xl">{recipe.description}</p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Ingredientes
                          </h4>
                          <ul className="space-y-3">
                            {recipe.ingredients.map((ing: any, i: number) => (
                              <li key={i} className="flex items-start gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                <Check className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                                <span>{ing.quantity} <span className="text-zinc-400 font-medium">{ing.name}</span></span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Modo de Preparo
                          </h4>
                          <ol className="space-y-5">
                            {recipe.instructions.map((step: string, i: number) => (
                              <li key={i} className="flex gap-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-black">{i+1}</span>
                                {step}
                              </li>
                            ))}
                          </ol>
                        </div>
                      </div>
                    </div>
                    
                    <div className="md:w-56 flex flex-col gap-3">
                      <button onClick={() => createListFromRecipe(recipe)} className="w-full py-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all group/btn">
                        <Wand2 className="w-8 h-8 group-hover/btn:rotate-12 transition-transform duration-300" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-4">Criar Lista de Compras</span>
                      </button>
                      <button onClick={() => saveRecipe(recipe)} className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-500 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 font-black uppercase tracking-widest text-[10px]">
                        <BookOpen className="w-4 h-4" /> Salvar Receita
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Receitas Salvas / Histórico */}
      <div className="mt-12 space-y-6">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Meu Livro de Receitas</h2>
        </div>
        
        {isLoadingSaved ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-zinc-50 dark:bg-zinc-900 rounded-3xl animate-pulse border border-zinc-100 dark:border-white/5" />
            ))}
          </div>
        ) : savedRecipes.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-white/5">
            <Sparkles className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm font-medium">Você ainda não salvou nenhuma receita.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savedRecipes.map(r => (
              <div 
                key={r.id} 
                onClick={() => setViewingRecipe(r)}
                className="glass-panel p-6 rounded-[2.5rem] flex items-center justify-between group cursor-pointer hover:border-indigo-500/30 transition-all bg-white dark:bg-zinc-900/40 border-2 border-transparent shadow-sm"
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                    <UtensilsCrossed className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-black text-zinc-900 dark:text-zinc-100 text-lg group-hover:text-indigo-500 transition-colors">{r.title}</h4>
                    <p className="text-[9px] text-zinc-500 font-black uppercase tracking-[0.2em]">{r.ingredients?.length || 0} Itens • {r.prep_time} • {r.difficulty}</p>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Receita Salva (Agora como Bottom Sheet / Drawer) */}
      <Drawer.Root open={!!viewingRecipe} onOpenChange={(open) => !open && setViewingRecipe(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-white dark:bg-zinc-950 flex flex-col rounded-t-[3.5rem] h-[92vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t-2 border-indigo-500/20 shadow-2xl">
            {viewingRecipe && (
              <div className="p-4 bg-white dark:bg-zinc-950 rounded-t-[3.5rem] flex-1 overflow-y-auto custom-scrollbar pb-20">
                <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-800 mb-8" />
                
                <div className="max-w-2xl mx-auto px-4 sm:px-8">
                  <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest">{viewingRecipe.difficulty}</span>
                      <span className="text-zinc-400 text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {viewingRecipe.prep_time}</span>
                    </div>
                    <button onClick={() => deleteSavedRecipe(viewingRecipe.id)} className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white transition-all active:scale-90">
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </header>
                  
                  <Drawer.Title className="text-4xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">
                    {viewingRecipe.title}
                  </Drawer.Title>
                  <Drawer.Description className="text-zinc-500 font-medium mb-12 text-lg leading-relaxed">
                    {viewingRecipe.description}
                  </Drawer.Description>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-8 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Ingredientes
                        </h4>
                        <ul className="space-y-4">
                          {viewingRecipe.ingredients.map((ing: any, i: number) => (
                            <li key={i} className="flex items-start gap-4 text-base font-bold text-zinc-700 dark:text-zinc-300">
                              <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <span>{ing.quantity} <span className="text-zinc-400 font-medium">{ing.name}</span></span>
                            </li>
                          ))}
                        </ul>
                     </div>
                     <div>
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-8 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" /> Preparo Passo a Passo
                        </h4>
                        <ol className="space-y-6">
                           {viewingRecipe.instructions.map((step: string, i: number) => (
                             <li key={i} className="flex gap-5 text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                                <span className="flex-shrink-0 w-8 h-8 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-500/20">{i+1}</span>
                                {step}
                             </li>
                           ))}
                        </ol>
                     </div>
                  </div>
                  
                  <div className="mt-16 flex flex-col sm:flex-row gap-4 border-t border-zinc-100 dark:border-white/5 pt-10">
                     <button 
                      onClick={() => createListFromRecipe(viewingRecipe)}
                      className="flex-1 py-6 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-2xl group"
                     >
                       <ShoppingBag className="w-5 h-5 group-hover:rotate-12 transition-transform" /> Criar Lista de Compras
                     </button>
                     <button 
                      onClick={() => setViewingRecipe(null)}
                      className="px-10 py-6 bg-zinc-100 dark:bg-zinc-900 rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] text-zinc-500 hover:text-zinc-900 dark:hover:text-white active:scale-95 transition-all border border-zinc-200 dark:border-white/5"
                     >
                       Fechar
                     </button>
                  </div>
                </div>
              </div>
            )}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </main>
  )
}
