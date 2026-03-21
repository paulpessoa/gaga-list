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
  Plus
} from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"

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
      router.push(`/pp/lists/${newList.id}`)
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
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          Receitas Inteligentes
        </h1>
        <p className="text-sm text-zinc-500 font-medium">
          Crie pratos incríveis com IA baseados no que você tem
        </p>
      </header>

      {/* Grid de Ferramentas IA */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sugerir da Lista */}
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-indigo-500/5 border-indigo-500/10">
          <div className="flex items-center gap-3 text-indigo-500">
            <UtensilsCrossed className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-widest text-xs">
              Sugerir da Lista
            </h2>
          </div>
          <select
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value="">Selecione uma lista...</option>
            {lists?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.title}
              </option>
            ))}
          </select>
          <button
            onClick={() => generateRecipes("from_list")}
            disabled={!selectedListId || isLoadingList}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingList ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Gerar 3 Sugestões"
            )}
          </button>
        </div>

        {/* Buscar Específica */}
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-rose-500/5 border-rose-500/10">
          <div className="flex items-center gap-3 text-rose-500">
            <ChefHat className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-widest text-xs">
              Buscar Específica
            </h2>
          </div>
          <input
            type="text"
            placeholder="Ex: Almoço rápido com frango..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none shadow-sm"
          />
          <button
            onClick={() => generateRecipes("custom")}
            disabled={!customQuery || isLoadingCustom}
            className="w-full py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingCustom ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              "Consultar Chef IA"
            )}
          </button>
        </div>

        {/* NOVO: Meus Produtos Selecionáveis */}
        <div className="md:col-span-2 glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-emerald-500/5 border-emerald-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
            <ShoppingBag className="w-32 h-32 text-emerald-500" />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-emerald-500">
              <Zap className="w-6 h-6" />
              <h2 className="font-black uppercase tracking-widest text-xs">
                Receita com Meus Produtos
              </h2>
            </div>
            {selectedProducts.length > 0 && (
              <button
                onClick={() => setSelectedProducts([])}
                className="text-[9px] font-black uppercase text-zinc-400 hover:text-rose-500"
              >
                Limpar ({selectedProducts.length})
              </button>
            )}
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Pesquisar nos meus produtos salvos..."
              value={searchProduct}
              onChange={(e) => setSearchProduct(e.target.value)}
              className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl py-3 pl-11 pr-4 text-xs font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-1 custom-scrollbar">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => toggleProduct(p.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-[10px] font-black uppercase transition-all active:scale-95 ${selectedProducts.includes(p.id) ? "bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20" : "bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/5 text-zinc-500"}`}
              >
                {selectedProducts.includes(p.id) ? (
                  <Check className="w-3 h-3" />
                ) : (
                  <Plus className="w-3 h-3" />
                )}
                {p.name}
              </button>
            ))}
            {myProducts.length === 0 && (
              <Link
                href="/pp/products"
                className="text-[10px] font-bold text-zinc-400 py-4 hover:text-emerald-500 underline"
              >
                Você ainda não tem produtos salvos. Scaneie produtos para
                começar.
              </Link>
            )}
          </div>

          <button
            onClick={() => generateRecipes("from_products")}
            disabled={selectedProducts.length === 0 || isLoadingProducts}
            className="w-full py-5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-[1.5rem] font-bold uppercase tracking-widest text-[10px] shadow-xl shadow-emerald-500/20 active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingProducts ? (
              <Loader2 className="w-4 h-4 animate-spin mx-auto" />
            ) : (
              `Criar Receita com ${selectedProducts.length} itens`
            )}
          </button>
        </div>
      </div>

      {/* Status de Carregamento IA (Feedback Visual) */}
      {loadingStatus && (
        <div className="flex flex-col items-center justify-center py-10 gap-4 animate-pulse">
          <div className="w-16 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          </div>
          <p className="text-sm font-black text-indigo-500 uppercase tracking-widest">
            {loadingStatus}
          </p>
        </div>
      )}

      {/* Resultados da IA Atual */}
      <div ref={resultsRef} className="scroll-mt-10">
        {recipes.length > 0 && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-2 px-2">
              <Wand2 className="w-4 h-4 text-indigo-500" />
              <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
                Sugestões Geradas
              </h2>
            </div>
            {recipes.map((recipe, idx) => (
              <div
                key={idx}
                className="glass-panel p-8 rounded-[3rem] animate-in slide-in-from-bottom duration-500 bg-white dark:bg-zinc-900/40 border-2 border-indigo-500/20"
              >
                <div className="flex flex-col md:flex-row justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                        {recipe.difficulty}
                      </span>
                      <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase">
                        <Clock className="w-3 h-3" /> {recipe.prep_time}
                      </div>
                    </div>
                    <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">
                      {recipe.title}
                    </h3>
                    <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6">
                      {recipe.description}
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">
                          Ingredientes
                        </h4>
                        <ul className="space-y-2">
                          {recipe.ingredients.map((ing: any, i: number) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300"
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              {ing.quantity} {ing.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">
                          Preparo
                        </h4>
                        <ol className="space-y-3">
                          {recipe.instructions.map(
                            (step: string, i: number) => (
                              <li
                                key={i}
                                className="flex gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed"
                              >
                                <span className="font-black text-indigo-500">
                                  {i + 1}.
                                </span>
                                {step}
                              </li>
                            )
                          )}
                        </ol>
                      </div>
                    </div>
                  </div>
                  <div className="md:w-48 flex flex-col gap-2">
                    <button
                      onClick={() => createListFromRecipe(recipe)}
                      className="w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all group"
                    >
                      <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-center">
                        Criar Lista
                      </span>
                    </button>
                    <button
                      onClick={() => saveRecipe(recipe)}
                      className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-500 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95"
                    >
                      <BookOpen className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">
                        Salvar
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Receitas Salvas / Histórico */}
      <div className="mt-10 space-y-6">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">
            Minhas Receitas
          </h2>
        </div>

        {isLoadingSaved ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-zinc-300" />
          </div>
        ) : savedRecipes.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-white/5">
            <p className="text-zinc-500 text-sm font-medium">
              Nenhuma receita salva ainda.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savedRecipes.map((r) => (
              <div
                key={r.id}
                onClick={() => setViewingRecipe(r)}
                className="glass-panel p-6 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:border-indigo-500/20 transition-all bg-white dark:bg-zinc-900/40"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                      {r.title}
                    </h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                      {r.ingredients?.length || 0} Ingredientes • {r.prep_time}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Receita Salva */}
      {viewingRecipe && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[2.5rem] sm:rounded-[3rem] shadow-2xl animate-in slide-in-from-bottom duration-500">
            <div className="sticky top-0 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md p-6 border-b border-zinc-100 dark:border-white/5 flex items-center justify-between z-10">
              <button
                onClick={() => setViewingRecipe(null)}
                className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
              >
                <X className="w-6 h-6" />
              </button>
              <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
                Receita Salva
              </h3>
              <button
                onClick={() => deleteSavedRecipe(viewingRecipe.id)}
                className="p-2 rounded-full hover:bg-rose-50 dark:hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>

            <div className="p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                  {viewingRecipe.difficulty}
                </span>
                <span className="text-zinc-400 text-[10px] font-bold uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {viewingRecipe.prep_time}
                </span>
              </div>

              <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-4">
                {viewingRecipe.title}
              </h2>
              <p className="text-zinc-500 font-medium mb-10 leading-relaxed">
                {viewingRecipe.description}
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
                    Ingredientes
                  </h4>
                  <ul className="space-y-3">
                    {viewingRecipe.ingredients.map((ing: any, i: number) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300"
                      >
                        <div className="w-2 h-2 rounded-full bg-indigo-500" />
                        {ing.quantity} {ing.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-6">
                    Passo a Passo
                  </h4>
                  <ol className="space-y-4">
                    {viewingRecipe.instructions.map(
                      (step: string, i: number) => (
                        <li
                          key={i}
                          className="flex gap-3 text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed"
                        >
                          <span className="font-black text-indigo-500">
                            {i + 1}.
                          </span>
                          {step}
                        </li>
                      )
                    )}
                  </ol>
                </div>
              </div>

              <div className="mt-12 flex flex-col sm:flex-row gap-4">
                <button
                  onClick={() => createListFromRecipe(viewingRecipe)}
                  className="flex-1 py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
                >
                  <ShoppingBag className="w-4 h-4" /> Criar Lista de Compras
                </button>
                <button
                  onClick={() => setViewingRecipe(null)}
                  className="px-8 py-5 border border-zinc-200 dark:border-white/10 rounded-2xl font-bold uppercase tracking-widest text-[10px] text-zinc-500 active:scale-95 transition-all"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}

