"use client"

import { useState, useEffect, useCallback } from "react"
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
  ShoppingBag
} from "lucide-react"
import { useRouter } from "next/navigation"

export default function RecipesPage() {
  const { data: lists } = useLists()
  const { trigger } = useHaptic()
  const router = useRouter()
  const supabase = createClient()
  
  const [selectedListId, setSelectedListId] = useState("")
  const [customQuery, setCustomQuery] = useState("")
  const [recipes, setRecipes] = useState<any[]>([])
  const [savedRecipes, setSavedRecipes] = useState<any[]>([])
  const [isLoadingList, setIsLoadingList] = useState(false)
  const [isLoadingCustom, setIsLoadingCustom] = useState(false)
  const [isLoadingSaved, setIsLoadingSaved] = useState(true)

  const fetchSavedRecipes = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false })
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

  const generateRecipes = async (type: 'from_list' | 'custom') => {
    if (type === 'from_list') setIsLoadingList(true)
    else setIsLoadingCustom(true)
    
    trigger("medium")
    try {
      let items: string[] = []
      if (type === 'from_list') {
        const response = await fetch(`/api/lists/${selectedListId}/items`)
        const listItems = await response.json()
        items = listItems.map((i: any) => i.name)
      } else {
        items = [customQuery]
      }

      const response = await fetch('/api/ai/recipes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items, type })
      })
      
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || "Erro na IA")
      
      setRecipes(data.recipes || [])
      trigger("success" as any)
    } catch (err: any) {
      alert(`Erro: ${err.message}`)
    } finally {
      setIsLoadingList(false)
      setIsLoadingCustom(false)
    }
  }

  const createListFromRecipe = async (recipe: any) => {
    trigger("medium")
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: `Ingredientes: ${recipe.title}` })
      })
      const newList = await response.json()

      for (const ingredient of recipe.ingredients) {
        await fetch(`/api/lists/${newList.id}/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: ingredient.name,
            quantity: ingredient.quantity || "1"
          })
        })
      }
      trigger("success" as any)
      router.push(`/dashboard/lists/${newList.id}`)
    } catch (err) {
      alert("Erro ao criar lista.")
    }
  }

  const saveRecipe = async (recipe: any) => {
    trigger("medium")
    try {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) return

      const { error } = await supabase
        .from('recipes')
        .insert({
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

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">Receitas Inteligentes</h1>
        <p className="text-sm text-zinc-500 font-medium">Crie pratos incríveis com IA baseados na sua dispensa</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-indigo-500/5 border-indigo-500/10">
          <div className="flex items-center gap-3 text-indigo-500">
            <UtensilsCrossed className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-widest text-xs">Sugerir da Lista</h2>
          </div>
          <select 
            value={selectedListId}
            onChange={(e) => setSelectedListId(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
          >
            <option value="">Selecione uma lista...</option>
            {lists?.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
          </select>
          <button 
            onClick={() => generateRecipes('from_list')}
            disabled={!selectedListId || isLoadingList}
            className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingList ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Gerar 3 Sugestões"}
          </button>
        </div>

        <div className="glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 bg-emerald-500/5 border-emerald-500/10">
          <div className="flex items-center gap-3 text-emerald-500">
            <ChefHat className="w-6 h-6" />
            <h2 className="font-black uppercase tracking-widest text-xs">Buscar Específica</h2>
          </div>
          <input 
            type="text"
            placeholder="Ex: Almoço rápido com frango..."
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border-none rounded-2xl py-4 px-5 text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none shadow-sm"
          />
          <button 
            onClick={() => generateRecipes('custom')}
            disabled={!customQuery || isLoadingCustom}
            className="w-full py-4 bg-emerald-500 hover:bg-emerald-600 text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all disabled:opacity-50"
          >
            {isLoadingCustom ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Consultar Chef IA"}
          </button>
        </div>
      </div>

      {/* Resultados da IA Atual */}
      {recipes.length > 0 && (
        <div className="flex flex-col gap-6">
          <div className="flex items-center gap-2 px-2">
            <Wand2 className="w-4 h-4 text-indigo-500" />
            <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Sugestões Geradas</h2>
          </div>
          {recipes.map((recipe, idx) => (
            <div key={idx} className="glass-panel p-8 rounded-[3rem] animate-in slide-in-from-bottom duration-500 bg-white dark:bg-zinc-900/40 border-2 border-indigo-500/20">
              <div className="flex flex-col md:flex-row justify-between gap-6">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-[10px] font-black uppercase tracking-widest">{recipe.difficulty}</span>
                    <div className="flex items-center gap-1 text-zinc-400 text-[10px] font-bold uppercase">
                      <Clock className="w-3 h-3" /> {recipe.prep_time}
                    </div>
                  </div>
                  <h3 className="text-2xl font-black text-zinc-900 dark:text-white mb-3">{recipe.title}</h3>
                  <p className="text-zinc-500 text-sm font-medium leading-relaxed mb-6">{recipe.description}</p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">Ingredientes</h4>
                      <ul className="space-y-2">
                        {recipe.ingredients.map((ing: any, i: number) => (
                          <li key={i} className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                            {ing.quantity} {ing.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-4 ml-1">Preparo</h4>
                      <ol className="space-y-3">
                        {recipe.instructions.map((step: string, i: number) => (
                          <li key={i} className="flex gap-3 text-xs font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                            <span className="font-black text-indigo-500">{i+1}.</span>
                            {step}
                          </li>
                        ))}
                      </ol>
                    </div>
                  </div>
                </div>
                <div className="md:w-48 flex flex-col gap-2">
                  <button onClick={() => createListFromRecipe(recipe)} className="w-full py-6 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-3xl flex flex-col items-center justify-center gap-2 shadow-2xl active:scale-95 transition-all group">
                    <Wand2 className="w-6 h-6 group-hover:rotate-12 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center">Criar Lista</span>
                  </button>
                  <button onClick={() => saveRecipe(recipe)} className="w-full py-3 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white text-indigo-500 rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95">
                    <BookOpen className="w-4 h-4" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Salvar</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Receitas Salvas / Histórico */}
      <div className="mt-10 space-y-6">
        <div className="flex items-center gap-2 px-2">
          <BookOpen className="w-4 h-4 text-zinc-400" />
          <h2 className="text-xs font-black uppercase tracking-widest text-zinc-400">Minhas Receitas</h2>
        </div>
        
        {isLoadingSaved ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-zinc-300" /></div>
        ) : savedRecipes.length === 0 ? (
          <div className="text-center py-12 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-white/5">
            <p className="text-zinc-500 text-sm font-medium">Nenhuma receita salva ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {savedRecipes.map(r => (
              <div key={r.id} className="glass-panel p-6 rounded-[2rem] flex items-center justify-between group cursor-pointer hover:border-indigo-500/20 transition-all bg-white dark:bg-zinc-900/40">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500">
                    <UtensilsCrossed className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100">{r.title}</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{r.ingredients?.length || 0} Ingredientes • {r.prep_time}</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-indigo-500 transition-colors" />
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
