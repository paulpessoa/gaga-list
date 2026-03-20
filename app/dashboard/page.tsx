// app/dashboard/page.tsx
"use client"

import { useLists, useCreateList, useDeleteList, useUpdateList } from "@/hooks/use-lists"
import { useUser } from "@/hooks/use-user"
import { useHaptic } from "@/hooks/use-haptic"
import {
  Plus,
  ShoppingBag,
  WifiOff,
  LogOut,
  User,
  Trash2,
  X,
  Edit2,
  CheckCircle2,
  ChevronRight,
  QrCode,
  Mic,
  Camera
} from "lucide-react"
import { useState, useEffect } from "react"
import Link from "next/link"

export default function Dashboard() {
  const { data: lists, isLoading, isError, error } = useLists()
  const { data: user } = useUser()
  const createList = useCreateList()
  const deleteList = useDeleteList()
  const updateList = useUpdateList()
  const { trigger } = useHaptic()

  const [isOffline, setIsOffline] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  
  // Estado para edição rápida
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [selectedListId, setSelectedListId] = useState<string | null>(null)

  useEffect(() => {
    const handleClickOutside = () => setSelectedListId(null)
    window.addEventListener("click", handleClickOutside)
    return () => window.removeEventListener("click", handleClickOutside)
  }, [])

  useEffect(() => {
    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const handleCreateList = () => {
    trigger("medium")
    setIsCreateModalOpen(true)
  }

  const submitCreateList = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return

    createList.mutate(
      {
        title: newListTitle,
        color_theme: "indigo"
      },
      {
        onSuccess: () => {
          setIsCreateModalOpen(false)
          setNewListTitle("")
        }
      }
    )
  }

  const handleRename = (listId: string, currentTitle: string) => {
    setEditingListId(listId)
    setEditTitle(currentTitle)
  }

  const submitRename = (listId: string) => {
    if (!editTitle.trim()) {
      setEditingListId(null)
      return
    }
    
    updateList.mutate({
      listId,
      updates: { title: editTitle }
    }, {
      onSuccess: () => setEditingListId(null)
    })
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10">
      {/* Header Melhorado */}
      <header className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              Minhas Listas
            </h1>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm">
              {lists?.length || 0} listas ativas • Gerencie seus itens e colaboradores
            </p>
          </div>

          <div className="flex items-center gap-3">
            {isOffline && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">
                <WifiOff className="w-3.5 h-3.5" />
                <span>OFFLINE</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Grid de Conteúdo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
        {/* Create Button Card */}
        <button
          onClick={handleCreateList}
          disabled={createList.isPending}
          className="glass-panel rounded-3xl p-8 flex flex-col items-center justify-center gap-4 min-h-[180px] border-dashed border-2 border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-300">
            <Plus className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {createList.isPending ? "Criando..." : "Nova Lista"}
            </span>
            <span className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
              Comece um novo projeto de compras
            </span>
          </div>
        </button>

        {/* Lists Loading State */}
        {isLoading ? (
          [1, 2].map(i => (
            <div key={i} className="glass-panel rounded-3xl p-8 min-h-[180px] animate-pulse">
              <div className="flex gap-4 mb-6">
                <div className="w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded w-1/2" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3" />
                </div>
              </div>
              <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mt-auto" />
            </div>
          ))
        ) : isError ? (
          <div className="col-span-full glass-panel rounded-3xl p-12 flex flex-col items-center justify-center border-red-500/20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white">Ops! Erro ao carregar listas</h3>
              <p className="text-zinc-500 text-sm max-w-xs mt-1">
                {(error as any)?.message || "Verifique sua conexão e tente novamente."}
              </p>
            </div>
          </div>
        ) : lists?.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4">
             <ShoppingBag className="w-16 h-16 text-zinc-200 dark:text-zinc-800" />
             <p className="text-zinc-400 text-center">Você ainda não tem nenhuma lista.<br/>Crie uma para começar!</p>
          </div>
        ) : (
          lists?.map((list: any) => {
            const totalItems = list.items?.length || 0
            const completedItems = list.items?.filter((i: any) => i.is_purchased).length || 0
            const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
            const isOwner = list.owner_id === user?.id

            return (
              <div key={list.id} className="relative group/card">
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (selectedListId === list.id) {
                      window.location.href = `/dashboard/lists/${list.id}`;
                    } else {
                      trigger("light");
                      setSelectedListId(list.id);
                    }
                  }}
                  className={`glass-panel rounded-3xl p-7 flex flex-col justify-between min-h-[180px] cursor-pointer transition-all duration-300 border-2 ${selectedListId === list.id ? "border-indigo-500 shadow-2xl scale-[1.02] bg-indigo-50/5 dark:bg-indigo-500/5" : "border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 shadow-sm"}`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-2xl shadow-inner">
                          {list.icon || "🛒"}
                        </div>
                        <div className="flex flex-col min-w-0">
                          {editingListId === list.id ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onBlur={() => submitRename(list.id)}
                              onKeyDown={(e) => e.key === "Enter" && submitRename(list.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-lg rounded px-2 py-0.5 outline-none ring-2 ring-indigo-500"
                            />
                          ) : (
                            <h3 className={`font-bold text-lg truncate transition-colors ${selectedListId === list.id ? "text-indigo-600 dark:text-indigo-400" : "text-zinc-900 dark:text-white"}`}>
                              {list.title}
                            </h3>
                          )}
                          <span className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">
                            {isOwner ? "Sua lista" : "Colaborador"}
                          </span>
                        </div>
                      </div>
                      
                      {/* Botão de Abrir Destacado quando selecionado */}
                      {selectedListId === list.id && (
                        <div className="w-10 h-10 rounded-full bg-indigo-500 text-white flex items-center justify-center shadow-lg animate-in zoom-in duration-300">
                           <ChevronRight className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    {/* Estatísticas de Itens */}
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                        <span className="text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Progresso</span>
                        <span className="text-zinc-900 dark:text-zinc-100">{completedItems}/{totalItems} itens</span>
                      </div>
                      <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-indigo-500 transition-all duration-500 ease-out"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800/50">
                    <div className="flex items-center gap-2">
                       <div className="flex -space-x-2">
                          <div className="w-7 h-7 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-950 flex items-center justify-center text-[9px] font-black text-white shadow-sm">
                            {isOwner ? "EU" : "CL"}
                          </div>
                       </div>
                       <span className="text-[10px] text-zinc-400 font-medium uppercase tracking-tighter">
                          Ativo agora
                       </span>
                    </div>
                    {selectedListId !== list.id && <ChevronRight className="w-4 h-4 text-zinc-300 dark:text-zinc-700 transition-all" />}
                  </div>
                </div>

                {/* Ações do Card - Visíveis quando selecionado ou hover no PC */}
                <div className={`absolute top-4 right-4 flex items-center gap-1 transition-all z-10 ${selectedListId === list.id ? "opacity-100 translate-y-0" : "opacity-0 translate-y-[-4px] group-hover/card:opacity-100 group-hover/card:translate-y-0"}`}>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleRename(list.id, list.title)
                    }}
                    className="p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-zinc-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (confirm("Mover esta lista para a lixeira?")) {
                          deleteList.mutate(list.id)
                        }
                      }}
                      className="p-2 rounded-xl bg-white/90 dark:bg-zinc-900/90 text-zinc-500 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-800 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Create List Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8">
              <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6">
                 <ShoppingBag className="w-8 h-8 text-indigo-500" />
              </div>
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2">Nova Lista</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">
                Organize suas compras com amigos e família de forma simples.
              </p>
            </div>

            <form onSubmit={submitCreateList} className="flex flex-col gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">Nome da Lista</label>
                <input
                  type="text"
                  placeholder="Ex: Mercado da Semana, Churrasco..."
                  required
                  autoFocus
                  value={newListTitle}
                  onChange={(e) => setNewListTitle(e.target.value)}
                  className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-[1.25rem] py-4 px-5 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner"
                />
              </div>
              
              <div className="flex flex-col gap-3">
                <button
                  type="submit"
                  disabled={createList.isPending || !newListTitle.trim()}
                  className="w-full py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[1.25rem] font-bold text-lg shadow-lg shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {createList.isPending ? "Criando..." : "Criar Lista"}
                </button>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      trigger("medium")
                      alert("Voz para Lista (GROQ) em desenvolvimento!")
                    }}
                    className="py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-white/5"
                  >
                    <Mic className="w-4 h-4 text-indigo-500" />
                    Via Áudio
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      trigger("medium")
                      alert("Foto de Papel para Lista (GROQ Vision) em desenvolvimento!")
                    }}
                    className="py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-white/5"
                  >
                    <Camera className="w-4 h-4 text-indigo-500" />
                    Via Foto
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    trigger("medium")
                    alert("Scanner de QR Code para entrar em listas em desenvolvimento!")
                  }}
                  className="w-full py-4 bg-white dark:bg-zinc-950 text-indigo-500 rounded-[1.25rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-50 dark:hover:bg-white/5 transition-all border border-indigo-500/20 shadow-sm"
                >
                  <QrCode className="w-4 h-4" />
                  Entrar via QR CODE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  )
}
