"use client"

import { useState, useEffect, useCallback, useRef, Suspense } from "react"
import { useLists } from "@/hooks/use-lists"
import { useHaptic } from "@/hooks/use-haptic"
import { createClient } from "@/lib/supabase/client"
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
  Plus,
  Sparkles,
  CheckCircle2
} from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { Drawer } from "vaul"
import { motion, AnimatePresence } from "framer-motion"
import { useAICreditCheck } from "@/hooks/use-ai-credit-check"

function RecipesContent() {
  const { data: lists } = useLists()
  const { trigger } = useHaptic()
  const { checkAndAct } = useAICreditCheck()
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Refs para scroll
  const resultsRef = useRef<HTMLDivElement>(null)

  // Estados de Navegação
  const [activeTab, setActiveTab] = useState<"generate" | "book">("generate")

  // Estados de Input
  const [selectedListId, setSelectedListId] = useState("")
  const [customQuery, setCustomQuery] = useState("")
  const [selectedProductNames, setSelectedProducts] = useState<string[]>([])

  // Detectar itens via URL (Deep Link do Inventário ou outras partes)
  useEffect(() => {
    const items = searchParams.get("items")
    if (items) {
      const names = items.split(",")
      setSelectedProducts(names)
      setActiveTab("generate")
    }
  }, [searchParams])

  // Estados de Resultado
  const [recipes, setRecipes] = useState<any[]>([])
  const [savedRecipes, setSavedRecipes] = useState<any[]>([])
  const [viewingRecipe, setViewingRecipe] = useState<any>(null)

  // Estados de Loading
  const [loadingStatus, setLoadingStatus] = useState("")
  const [isLoading, setIsLoading] = useState(false)
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

  useEffect(() => {
    fetchSavedRecipes()
  }, [fetchSavedRecipes])

  const generateRecipes = async (type: "from_list" | "custom" | "from_selection") => {
    setIsLoading(true)
    setLoadingStatus("Chef IA preparando sugestões...")
    trigger("medium")

    try {
      let items: string[] = []

      if (type === "from_list") {
        if (!selectedListId) return
        const response = await fetch(`/api/lists/${selectedListId}/items`)
        const result = await response.json()
        const listItems = result.data || []
        
        if (listItems.length === 0) {
          alert("Sua lista está vazia! Adicione ingredientes antes de pedir sugestões ao Chef.")
          setIsLoading(false)
          setLoadingStatus("")
          return
        }
        
        items = listItems.map((i: any) => i.name)
      } else if (type === "from_selection") {
        items = selectedProductNames
      } else {
        items = [customQuery]
      }

      if (items.length === 0) throw new Error("Nenhum item selecionado.")

      const response = await fetch("/api/ai/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, type: type === "custom" ? "custom" : "from_products" })
      })

      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro na IA")

      setRecipes(data.recipes || [])
      trigger("success" as any)

      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsLoading(false)
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

      // Usar loop sequencial para garantir persistência e ordem
      for (const ingredient of recipe.ingredients) {
        try {
          await fetch(`/api/lists/${newList.id}/items`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: ingredient.name,
              quantity: ingredient.quantity || "1",
              unit: ingredient.unit || null
            })
          })
        } catch (itemErr) {
          console.error(`Falha ao adicionar item: ${ingredient.name}`, itemErr)
        }
      }
      
      trigger("success" as any)
      router.push(`/app/lists/${newList.id}`)
    } catch (err) {
      console.error("Erro geral na criação da lista:", err)
      alert("Erro ao criar lista. Tente novamente.")
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

  return (
    <main className="min-h-screen p-5 md:p-10 max-w-4xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          Receitas Inteligentes
        </h1>
        <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest opacity-70">Cozinha com IA</p>
      </header>

      <div className="flex items-center p-1.5 bg-zinc-100 dark:bg-zinc-900 rounded-[2rem] border border-zinc-200 dark:border-white/5">
        <button
          onClick={() => { setActiveTab("generate"); trigger("light"); }}
          className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "generate" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-xl shadow-black/5" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
        >
          Gerar
        </button>
        <button
          onClick={() => { setActiveTab("book"); trigger("light"); }}
          className={`flex-1 py-4 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "book" ? "bg-white dark:bg-zinc-800 text-rose-500 shadow-xl shadow-black/5" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"}`}
        >
          Meu Livro
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "generate" && (
          <motion.div
            key="generate"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-6"
          >
            {selectedProductNames.length > 0 && (
              <div className="glass-panel p-8 rounded-[3rem] flex flex-col gap-6 bg-emerald-500/5 border-2 border-emerald-500/20 relative overflow-hidden">
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <Zap className="w-5 h-5" />
                    <h2 className="font-black uppercase tracking-widest text-[10px]">Cozinhar com Seleção</h2>
                  </div>
                  <button onClick={() => { setSelectedProducts([]); router.replace('/app/recipes'); }} className="p-2 text-zinc-400 hover:text-rose-500"><X className="w-5 h-5" /></button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedProductNames.map((name, idx) => (
                    <span key={idx} className="px-3 py-1.5 bg-white dark:bg-zinc-800 border border-emerald-500/20 rounded-lg text-[9px] font-black uppercase text-emerald-600 dark:text-emerald-400">{name}</span>
                  ))}
                </div>
                <button
                  onClick={() => checkAndAct(1, () => generateRecipes("from_selection"))}
                  disabled={isLoading}
                  className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 active:scale-95 transition-all"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : "Gerar com estes itens"}
                </button>
              </div>
            )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-indigo-500/5 border-2 border-indigo-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-indigo-500">
              <UtensilsCrossed className="w-5 h-5" />
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
            {lists
              ?.filter((l: any) => (l.items?.length || 0) > 0) // Filtrar apenas listas com itens
              .map((l: any) => (
                <option key={l.id} value={l.id}>
                  {l.title} ({l.items?.length} itens)
                </option>
              ))}
          </select>
          {lists?.every((l: any) => (l.items?.length || 0) === 0) && (
            <p className="text-[9px] text-rose-500 font-bold text-center -mt-2 px-2">
              Você não tem listas com itens para cozinhar.
            </p>
          )}
          <button 
            onClick={() => checkAndAct(1, () => generateRecipes('from_list'))}
            disabled={!selectedListId || isLoading}
            className="w-full py-4.5 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
          >
            Gerar da Lista
          </button>
        </div>

              <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-rose-500/5 border-2 border-rose-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-rose-500">
                    <ChefHat className="w-5 h-5" />
                    <h2 className="font-black uppercase tracking-widest text-[10px]">Busca Criativa</h2>
                  </div>
                  <div className="px-2 py-1 bg-rose-500/10 rounded-lg">
                    <span className="text-[8px] font-black text-rose-500 uppercase">1 Grão</span>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="Ex: Jantar romântico..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                  className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none shadow-inner"
                />
                <button
                  onClick={() => checkAndAct(1, () => generateRecipes("custom"))}
                  disabled={!customQuery || isLoading}
                  className="w-full py-4.5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
                >
                  Consultar Chef
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "book" && (
          <motion.div
            key="book"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
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
                    className="glass-panel p-6 rounded-[2.5rem] flex items-center justify-between group cursor-pointer bg-white dark:bg-zinc-900/40 border-2 border-transparent shadow-sm hover:border-indigo-500/30 transition-all"
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
                    <ChevronRight className="w-5 h-5 text-zinc-300" />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div ref={resultsRef} className="scroll-mt-10">
        <AnimatePresence>
          {recipes.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
              {recipes.map((recipe, idx) => (
                <div key={idx} className="glass-panel p-10 rounded-[3.5rem] bg-white dark:bg-zinc-900/40 border-2 border-indigo-500/10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:scale-110 transition-transform duration-700"><ChefHat className="w-64 h-64 text-indigo-500" /></div>
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest">{recipe.difficulty}</span>
                        <span className="flex items-center gap-1.5 text-zinc-400 text-[9px] font-black uppercase"><Clock className="w-3.5 h-3.5" /> {recipe.prep_time}</span>
                      </div>
                      <h3 className="text-3xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">{recipe.title}</h3>
                      <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-10 max-w-2xl">{recipe.description}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
                        <div>
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Ingredientes</h4>
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
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-6 flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Modo de Preparo</h4>
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
                      <button onClick={() => createListFromRecipe(recipe)} className="w-full py-8 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                        <Wand2 className="w-8 h-8" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-center px-4">Criar Lista</span>
                      </button>
                      <button onClick={() => saveRecipe(recipe)} className="w-full py-4 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-500 rounded-2xl flex items-center justify-center gap-2 font-black uppercase text-[10px]">
                        <BookOpen className="w-4 h-4" /> Salvar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Drawer.Root open={!!viewingRecipe} onOpenChange={(open) => !open && setViewingRecipe(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]" />
          <Drawer.Content className="bg-white dark:bg-zinc-950 flex flex-col rounded-t-[3.5rem] h-[92vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t-2 border-indigo-500/20">
            {viewingRecipe && (
              <div className="p-4 bg-white dark:bg-zinc-950 rounded-t-[3.5rem] flex-1 overflow-y-auto pb-20">
                <div className="mx-auto w-12 h-1.5 rounded-full bg-zinc-300 dark:bg-zinc-800 mb-8" />
                <div className="max-w-2xl mx-auto px-4 sm:px-8">
                  <header className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl text-[9px] font-black uppercase tracking-widest">{viewingRecipe.difficulty}</span>
                      <span className="text-zinc-400 text-[9px] font-black uppercase flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {viewingRecipe.prep_time}</span>
                    </div>
                    <button onClick={() => deleteSavedRecipe(viewingRecipe.id)} className="p-3 rounded-2xl bg-rose-500/10 text-rose-500 active:scale-90 transition-all"><Trash2 className="w-5 h-5" /></button>
                  </header>
                  <Drawer.Title className="text-4xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">{viewingRecipe.title}</Drawer.Title>
                  <Drawer.Description className="text-zinc-500 font-medium mb-12 text-lg leading-relaxed">{viewingRecipe.description}</Drawer.Description>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-8 flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Ingredientes</h4>
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
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500 mb-8 flex items-center gap-3"><div className="w-2 h-2 rounded-full bg-indigo-500" /> Passo a Passo</h4>
                      <ol className="space-y-6">
                        {viewingRecipe.instructions.map((step: string, i: number) => (
                          <li key={i} className="flex gap-5 text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            <span className="flex-shrink-0 w-8 h-8 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-xs font-black">{i+1}</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                  <div className="mt-16 flex gap-4 border-t border-zinc-100 dark:border-white/5 pt-10">
                    <button onClick={() => createListFromRecipe(viewingRecipe)} className="flex-1 py-6 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-3xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all">
                      <ShoppingBag className="w-5 h-5" /> Criar Lista
                    </button>
                    <button onClick={() => setViewingRecipe(null)} className="px-10 py-6 bg-zinc-100 dark:bg-zinc-900 rounded-3xl font-black uppercase text-[10px] text-zinc-500 active:scale-95 transition-all">Fechar</button>
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

export default function RecipesPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><Loader2 className="w-8 h-8 animate-spin text-indigo-500" /></div>}>
      <RecipesContent />
    </Suspense>
  )
}
