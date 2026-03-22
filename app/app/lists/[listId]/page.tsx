"use client"

import { use, useState, useMemo, useEffect, useRef, useCallback } from "react"
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem
} from "@/hooks/use-items"
import {
  useLists,
  useCollaborators,
  useAddCollaborator,
  useRemoveCollaborator,
  useInviteUser,
  useUpdateList,
  useDeleteList
} from "@/hooks/use-lists"
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  MessageCircle,
  Map as MapIcon,
  ChevronDown,
  ChevronUp,
  UserPlus,
  Clock,
  Coins,
  Edit2,
  LogOut,
  Mic,
  Camera,
  Loader2
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { useUser } from "@/hooks/use-user"
import { ShareModal } from "@/components/lists/share-modal"
import { ListChat } from "@/components/lists/list-chat"
import { Collaborator } from "@/types"
import Image from "next/image"
import { COMMON_GROCERY_ITEMS } from "@/lib/constants/grocery-items"
import { useRouter } from "next/navigation"

import { AICreditLock } from "@/components/ui/ai-credit-lock"
import { VisionScanner } from "@/components/ui/vision-scanner"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"

export default function ListDetail({
  params
}: {
  params: Promise<{ listId: string }>
}) {
  const router = useRouter()
  const { listId } = use(params)
  const searchParams = useSearchParams()
  const { data: lists } = useLists()
  const list = lists?.find((l) => l.id === listId)
  const { data: user } = useUser()

  const { data: items, isLoading } = useItems(listId)
  const createItem = useCreateItem(listId)
  const updateItem = useUpdateItem(listId)
  const deleteItem = useDeleteItem(listId)
  const updateList = useUpdateList()
  const { trigger } = useHaptic()

  // Estados da Interface
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [chatTarget, setChatTarget] = useState<
    | { id: string; full_name: string | null; avatar_url: string | null }
    | undefined
  >(undefined)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  const handleUpdateTitle = useCallback(() => {
    if (editTitle.trim() && editTitle !== list?.title) {
      updateList.mutate({
        listId,
        updates: { title: editTitle.trim() }
      })
      trigger("success")
    }
    setIsEditingTitle(false)
  }, [editTitle, list?.title, listId, updateList, trigger])

  // Hooks de Colaboradores
  const { data: collaborators } = useCollaborators(listId)
  const addCollaborator = useAddCollaborator(listId)
  const removeCollaborator = useRemoveCollaborator(listId)
  const inviteUser = useInviteUser(listId)

  const otherCollaborators = useMemo(() => {
    return (
      (collaborators as Collaborator[] | undefined)?.filter(
        (c) => c.user_id !== user?.id && c.profiles?.id !== user?.id
      ) || []
    )
  }, [collaborators, user?.id])

  useEffect(() => {
    const openChat = searchParams.get("openChat")
    const targetId = searchParams.get("targetId")

    if (openChat === "true" && !isChatOpen) {
      const timer = setTimeout(() => {
        if (targetId && collaborators) {
          const collab = (collaborators as Collaborator[]).find(
            (c) => c.user_id === targetId || c.profiles?.id === targetId
          )
          if (collab && chatTarget?.id !== targetId) {
            setChatTarget({
              id: targetId,
              full_name: collab.profiles?.full_name || null,
              avatar_url: collab.profiles?.avatar_url || null
            })
          }
        }
        setIsChatOpen(true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [searchParams, collaborators, isChatOpen, chatTarget?.id])

  // Estados para IA (Voz/Foto)
  const [isOcrScannerOpen, setIsOcrScannerOpen] = useState(false)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [voiceItems, setVoiceItems] = useState<any[]>([])
  const [showAiPreview, setShowAiPreview] = useState(false)

  const {
    isRecording,
    startRecording,
    stopRecording,
    audioBlob,
    setAudioBlob
  } = useAudioRecorder()

  const handleProcessVoice = useCallback(
    async (blob: Blob) => {
      setIsAiProcessing(true)
      const formData = new FormData()
      formData.append("file", blob, "recording.m4a")

      try {
        const response = await fetch("/api/ai/voice", {
          method: "POST",
          body: formData
        })
        const data = await response.json()
        if (data.items) {
          setVoiceItems(data.items)
          setShowAiPreview(true)
          trigger("success" as any)
        }
      } catch (err) {
        console.error(err)
        alert("Erro ao processar voz")
      } finally {
        setIsAiProcessing(false)
        setAudioBlob(null)
      }
    },
    [trigger, setAudioBlob]
  )

  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleProcessVoice(audioBlob)
    }
  }, [audioBlob, isRecording, handleProcessVoice])

  const handleOcrSuccess = (data: any) => {
    if (data.items) {
      setVoiceItems(data.items)
      setShowAiPreview(true)
      setIsOcrScannerOpen(false)
    }
  }

  const confirmAiItems = () => {
    trigger("medium")
    voiceItems.forEach((item) => {
      createItem.mutate({
        name: item.name,
        category: item.category || null,
        unit: item.unit || item.quantity || null
      })
    })
    setShowAiPreview(false)
    setVoiceItems([])
  }

  const handleAddItem = (name: string, category?: string, unit?: string) => {
    if (!name.trim()) return
    trigger("medium")
    createItem.mutate({
      name: name.trim(),
      category: category || null,
      unit: unit || null
    })
    setNewItemName("")
    setShowSuggestions(false)
  }

  const handleToggleItem = (item: any) => {
    trigger("light")
    const isPurchased = !item.is_purchased
    updateItem.mutate({
      itemId: item.id,
      updates: {
        is_purchased: isPurchased,
        checked_by: isPurchased ? user?.id : null,
        checked_at: isPurchased ? new Date().toISOString() : null
      } as any
    })
  }

  const handleDeleteItem = (itemId: string) => {
    trigger("heavy")
    deleteItem.mutate(itemId)
  }

  const handleUpdateRichData = (itemId: string, field: string, value: any) => {
    updateItem.mutate({
      itemId,
      updates: { [field]: value } as any
    })
  }

  const [newItemName, setNewItemName] = useState("")
  const suggestions = useMemo(() => {
    if (!newItemName.trim()) return []
    return COMMON_GROCERY_ITEMS.filter((item) =>
      item.name.toLowerCase().includes(newItemName.toLowerCase())
    ).slice(0, 5)
  }, [newItemName])

  const [filter, setFilter] = useState<"pending" | "purchased" | "all">("all")
  const [sortBy, setSortBy] = useState<"name" | "recent" | "none">("none")

  const pendingItems = useMemo(
    () => items?.filter((i) => !i.is_purchased) || [],
    [items]
  )
  const purchasedItems = useMemo(
    () => items?.filter((i) => i.is_purchased) || [],
    [items]
  )

  const pendingSum = useMemo(
    () =>
      pendingItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [pendingItems]
  )

  const purchasedSum = useMemo(
    () =>
      purchasedItems.reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [purchasedItems]
  )

  const filteredAndSortedItems = useMemo(() => {
    let result = [...(items || [])]

    if (filter === "pending") result = result.filter((i) => !i.is_purchased)
    if (filter === "purchased") result = result.filter((i) => i.is_purchased)

    if (sortBy === "name") {
      result.sort((a, b) => a.name.localeCompare(b.name))
    } else if (sortBy === "recent") {
      result.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    }

    return result
  }, [items, filter, sortBy])

  const handleClearFilters = () => {
    setFilter("all")
    setSortBy("none")
    trigger("light")
  }

  const isOwner = list?.owner_id === user?.id

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-32 transition-colors duration-300">
      {/* HEADER FUNCIONAL STAFF LEVEL */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <Link
                href="/app"
                className="p-2 -ml-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white shrink-0"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2 min-w-0">
                {isEditingTitle && isOwner ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={handleUpdateTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleUpdateTitle()
                      if (e.key === "Escape") setIsEditingTitle(false)
                    }}
                    className="bg-zinc-100 dark:bg-zinc-900 text-lg font-black rounded px-2 outline-none ring-2 ring-indigo-500 w-full"
                  />
                ) : (
                  <>
                    <h1 className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-tight truncate">
                      {list?.title || "Carregando..."}
                    </h1>
                    {isOwner && (
                      <button
                        onClick={() => {
                          setEditTitle(list?.title || "")
                          setIsEditingTitle(true)
                        }}
                        className="p-1 text-zinc-400 hover:text-indigo-500 transition-colors shrink-0"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  trigger("light")
                  setIsChatOpen(true)
                }}
                className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 border border-indigo-500/10"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  trigger("light")
                  router.push(`/app/lists/${listId}/map`)
                }}
                className="w-10 h-10 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border border-emerald-500/10"
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Itens
                </span>
                <span className="text-sm font-black text-indigo-500 leading-none mt-1">
                  {items?.length || 0}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Faltando
                </span>
                <span className="text-sm font-black text-rose-500 leading-none mt-1">
                  R$ {pendingSum.toFixed(2)}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Comprado
                </span>
                <span className="text-sm font-black text-emerald-500 leading-none mt-1">
                  R$ {purchasedSum.toFixed(2)}
                </span>
              </div>
            </div>

            <div
              className="flex items-center -space-x-2 cursor-pointer group shrink-0"
              onClick={() => setIsShareModalOpen(true)}
            >
              {otherCollaborators.slice(0, 2).map((collab, i) => (
                <div
                  key={collab.user_id || `collab-${i}`}
                  className="w-7 h-7 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-sm"
                  style={{ zIndex: 10 - i }}
                >
                  <Image
                    src={
                      collab.profiles?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(collab.profiles?.full_name || "U")}&background=6366f1&color=fff`
                    }
                    width={28}
                    height={28}
                    className="object-cover"
                    alt="Avatar"
                  />
                </div>
              ))}
              <div className="w-7 h-7 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-500 group-hover:border-indigo-500 transition-all ml-1 shadow-inner">
                <UserPlus className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
        {/* INPUT HÍBRIDO */}
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddItem(newItemName)
            }}
            className="flex gap-3"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Adicionar item..."
                value={newItemName}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setNewItemName(e.target.value)
                  setShowSuggestions(true)
                }}
                className="w-full bg-zinc-50 dark:bg-zinc-900/40 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] py-5 px-6 pr-24 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none transition-all shadow-inner font-bold text-base"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                <AICreditLock variant="overlay">
                  <button
                    type="button"
                    onClick={() =>
                      isRecording ? stopRecording() : startRecording()
                    }
                    className={`p-2.5 rounded-xl transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "text-zinc-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-800"}`}
                  >
                    {isAiProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Mic className="w-5 h-5" />
                    )}
                  </button>
                </AICreditLock>
                <AICreditLock variant="overlay">
                  <button
                    type="button"
                    onClick={() => {
                      trigger("medium")
                      setIsOcrScannerOpen(true)
                    }}
                    className="p-2.5 rounded-xl text-zinc-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-800 transition-all"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                </AICreditLock>
              </div>
            </div>
            <button
              type="submit"
              disabled={createItem.isPending || !newItemName.trim()}
              className="w-16 h-16 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 shadow-2xl active:scale-95 group"
            >
              <Plus className="w-8 h-8 group-hover:scale-110 transition-transform" />
            </button>
          </form>

          {/* AI PREVIEW MODAL */}
          {showAiPreview && (
            <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-300">
              <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200">
                <div className="mb-6 text-center">
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                    Itens Identificados
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium">
                    A IA encontrou estes itens. Deseja adicionar à lista?
                  </p>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-3xl p-4 mb-6 max-h-60 overflow-y-auto border border-zinc-100 dark:border-white/5 shadow-inner">
                  <ul className="space-y-2">
                    {voiceItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-100 dark:border-white/5 text-sm font-bold text-zinc-700 dark:text-zinc-300"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        <span className="flex-1">{item.name}</span>
                        {item.quantity && (
                          <span className="text-[10px] opacity-50">
                            {item.quantity}
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmAiItems}
                    className="w-full py-4.5 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg active:scale-95 transition-all"
                  >
                    Confirmar e Adicionar
                  </button>
                  <button
                    onClick={() => {
                      setShowAiPreview(false)
                      setVoiceItems([])
                    }}
                    className="w-full py-4 text-zinc-400 font-black uppercase tracking-widest text-[10px] hover:text-rose-500 transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Sugestões de Autocomplete */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-20 mt-3 z-30 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAddItem(s.name, s.category, s.unit)}
                  className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/5 flex items-center justify-center text-lg">
                      🛒
                    </div>
                    <div>
                      <p className="font-black text-zinc-900 dark:text-white text-sm tracking-tight uppercase">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest opacity-60">
                        {s.category}
                      </p>
                    </div>
                  </div>
                  <Plus className="w-5 h-5 text-indigo-500/30" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FILTROS E ORDENAÇÃO */}
        <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-2 px-2">
          <button
            onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${filter === "pending" ? "bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
          >
            Faltando
          </button>
          <button
            onClick={() =>
              setFilter(filter === "purchased" ? "all" : "purchased")
            }
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${filter === "purchased" ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
          >
            Comprado
          </button>
          <div className="w-px h-8 bg-zinc-100 dark:bg-zinc-800 shrink-0 mx-1" />
          <button
            onClick={() => setSortBy(sortBy === "name" ? "none" : "name")}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${sortBy === "name" ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
          >
            A-Z
          </button>
          <button
            onClick={() => setSortBy(sortBy === "recent" ? "none" : "recent")}
            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${sortBy === "recent" ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
          >
            Mais Recentes
          </button>
          <button
            onClick={handleClearFilters}
            className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 hover:text-indigo-500"
          >
            Limpar
          </button>
        </div>

        {/* LISTA DE ITENS */}
        <div className="flex flex-col gap-4">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel rounded-[2rem] p-8 h-20 animate-pulse bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-100 dark:border-white/5"
              />
            ))
          ) : filteredAndSortedItems?.length === 0 ? (
            <div className="py-24 flex flex-col items-center justify-center gap-6 text-center glass-panel rounded-[3rem] border-dashed border-2">
              <div className="w-24 h-24 rounded-[2.5rem] bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-2">
                <ShoppingCart className="w-10 h-10 text-zinc-200 dark:text-zinc-800" />
              </div>
              <div>
                <p className="text-zinc-400 font-black uppercase tracking-[0.2em] text-[10px]">
                  Nenhum item encontrado
                </p>
                <p className="text-zinc-500 text-sm mt-1 font-medium">
                  Use os filtros acima ou adicione novos itens.
                </p>
              </div>
            </div>
          ) : (
            filteredAndSortedItems?.map((item: any) => (
              <div
                key={item.id}
                className={`flex flex-col rounded-3xl transition-all duration-300 border ${expandedItemId === item.id ? "bg-zinc-50/50 dark:bg-zinc-900/30 border-indigo-500/30 shadow-lg" : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 shadow-sm"}`}
              >
                {/* Linha Principal do Item */}
                <div className="flex items-center justify-between p-4 px-5">
                  <div className="flex items-center gap-4 flex-1">
                    <button
                      onClick={() => handleToggleItem(item)}
                      className="transition-transform active:scale-90"
                    >
                      {item.is_purchased ? (
                        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-in zoom-in-50 duration-200">
                          <CheckCircle2 className="w-4 h-4 text-white" />
                        </div>
                      ) : (
                        <Circle className="w-7 h-7 text-zinc-200 dark:text-zinc-800 group-hover:text-indigo-500 transition-colors" />
                      )}
                    </button>

                    <div
                      className="flex flex-col flex-1 cursor-pointer min-w-0"
                      onClick={() =>
                        setExpandedItemId(
                          expandedItemId === item.id ? null : item.id
                        )
                      }
                    >
                      <span
                        className={`font-bold text-sm truncate ${item.is_purchased ? "line-through text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"}`}
                      >
                        {item.name}
                      </span>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tighter">
                          {item.quantity} {item.unit || "un"}
                        </span>
                        {item.price > 0 && (
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tighter">
                            • R$ {(item.price * item.quantity).toFixed(2)}
                          </span>
                        )}
                        {item.is_purchased && item.checked_by_profile && (
                          <div className="flex items-center gap-1.5 ml-2">
                            <div className="w-3.5 h-3.5 rounded-full bg-zinc-200 overflow-hidden">
                              <Image
                                src={
                                  item.checked_by_profile.avatar_url ||
                                  `https://ui-avatars.com/api/?name=${item.checked_by_profile.full_name}&background=6366f1&color=fff`
                                }
                                width={14}
                                height={14}
                                alt="Avatar"
                              />
                            </div>
                            <span className="text-[9px] font-bold text-zinc-500">
                              Pego por{" "}
                              {item.checked_by_profile.full_name?.split(" ")[0]}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        setExpandedItemId(
                          expandedItemId === item.id ? null : item.id
                        )
                      }
                      className={`p-2 rounded-xl transition-all ${expandedItemId === item.id ? "bg-indigo-500 text-white" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"}`}
                    >
                      {expandedItemId === item.id ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Área de Detalhes (Expandida) */}
                {expandedItemId === item.id && (
                  <div className="px-5 pb-6 pt-2 flex flex-col gap-5 border-t border-zinc-100 dark:border-zinc-900/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                          Qtd / Medida
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) =>
                              handleUpdateRichData(
                                item.id,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-16 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <input
                            type="text"
                            placeholder="un, kg, L..."
                            value={item.unit || ""}
                            onChange={(e) =>
                              handleUpdateRichData(
                                item.id,
                                "unit",
                                e.target.value
                              )
                            }
                            className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                          Preço Unitário
                        </label>
                        <div className="relative">
                          <input
                            type="number"
                            step="0.01"
                            placeholder="0,00"
                            value={item.price || ""}
                            onChange={(e) =>
                              handleUpdateRichData(
                                item.id,
                                "price",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 pl-10 px-3 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          />
                          <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                        Observações
                      </label>
                      <textarea
                        placeholder="Ex: Marca preferida, ponto da carne..."
                        value={item.notes || ""}
                        onChange={(e) =>
                          handleUpdateRichData(item.id, "notes", e.target.value)
                        }
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3 px-4 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none h-20 resize-none"
                      />
                    </div>

                    <div className="flex items-center justify-end pt-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-3 rounded-xl text-zinc-300 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
                        title="Remover Item"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        listId={listId}
        collaborators={(collaborators || []) as Collaborator[]}
        isOwner={isOwner}
        currentUser={user}
        onAddCollaborator={(email, callbacks) =>
          addCollaborator.mutate(email, callbacks)
        }
        onInviteUser={(email, callbacks) => inviteUser.mutate(email, callbacks)}
        onRemoveCollaborator={(userId) => {
          removeCollaborator.mutate(userId, {
            onSuccess: () => {
              if (userId === user?.id) {
                router.push("/app")
              }
            }
          })
        }}
        onOpenChat={(target) => {
          setChatTarget(target)
          setIsChatOpen(true)
        }}
      />

      <ListChat
        listId={listId}
        currentUser={user}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false)
          setChatTarget(undefined)
        }}
        targetUser={chatTarget}
      />

      <VisionScanner
        mode="ocr"
        isOpen={isOcrScannerOpen}
        onClose={() => setIsOcrScannerOpen(false)}
        onScanSuccess={handleOcrSuccess}
      />
    </main>
  )
}
