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
  Loader2,
  Filter
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { useUser } from "@/hooks/use-user"
import { usePresence } from "@/hooks/use-presence"
import { ShareModal } from "@/components/lists/share-modal"
import { ListChat } from "@/components/lists/list-chat"
import { Collaborator } from "@/types"
import Image from "next/image"
import { useRouter } from "next/navigation"

import { useAICreditCheck } from "@/hooks/use-ai-credit-check"
import { VisionScanner } from "@/components/ui/vision-scanner"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { CreateItemModal } from "@/components/lists/create-item-modal"
import { 
  cn, 
  formatCurrency, 
  formatPriceMask, 
  parsePriceFromMask 
} from "@/lib/utils"

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
  const { trigger } = useHaptic()

  const { data: items, isLoading } = useItems(listId)
  const createItem = useCreateItem(listId)
  const updateItem = useUpdateItem(listId)
  const deleteItem = useDeleteItem(listId)
  const updateList = useUpdateList()

  // Estados da Interface
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [isCreateItemModalOpen, setIsCreateItemModalOpen] = useState(false)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  const isOwner = list?.owner_id === user?.id

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

    if (openChat === "true" && !isChatOpen) {
      setIsChatOpen(true)
      // Limpa o parâmetro da URL sem recarregar a página
      router.replace(`/app/lists/${listId}`, { scroll: false })
    }
  }, [searchParams, isChatOpen, router, listId])

  // Estados para IA (Voz/Foto)
  const [isOcrScannerOpen, setIsOcrScannerOpen] = useState(false)
  const { onlineUsers, myLocation } = usePresence(listId, user)
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
          trigger("success")
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
    setIsCreateItemModalOpen(false)
  }

  const handleAddItem = (name: string, category?: string, unit?: string, quantity?: number) => {
    if (!name.trim()) return
    trigger("medium")
    createItem.mutate({
      name: name.trim(),
      category: category || null,
      unit: unit || null,
      quantity: quantity || 1
    })
    setIsCreateItemModalOpen(false)
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
    if (confirm("Tem certeza que deseja excluir este item?")) {
      trigger("heavy")
      deleteItem.mutate(itemId)
    }
  }

  const handleUpdateRichData = (itemId: string, field: string, value: any) => {
    updateItem.mutate({
      itemId,
      updates: { [field]: value } as any
    })
  }

  const [filter, setFilter] = useState<"pending" | "purchased" | "all">("all")
  const [sortBy, setSortBy] = useState<"name" | "recent" | "none">("none")

  const pendingSum = useMemo(
    () =>
      (items || []).filter(i => !i.is_purchased).reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [items]
  )

  const purchasedSum = useMemo(
    () =>
      (items || []).filter(i => i.is_purchased).reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [items]
  )

  const filteredItems = useMemo(() => {
    if (!items) return []
    
    let result = [...items]

    // 1. Filtros de Status
    if (filter === "pending") {
      result = result.filter((i) => !i.is_purchased)
    } else if (filter === "purchased") {
      result = result.filter((i) => i.is_purchased)
    }

    // 2. Ordenação
    result.sort((a, b) => {
      const nameA = (a.name || "").toLowerCase().trim()
      const nameB = (b.name || "").toLowerCase().trim()

      // Se A-Z estiver ativo, ignora completamente as categorias
      if (sortBy === "name") {
        return nameA.localeCompare(nameB)
      }

      // Se Recentes estiver ativo
      if (sortBy === "recent") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }

      // Padrão: Agrupar por Categoria (Estável) e então por Nome
      const catA = (a.category || "Sem Categoria").toLowerCase().trim()
      const catB = (b.category || "Sem Categoria").toLowerCase().trim()
      
      if (catA !== catB) {
        return catA.localeCompare(catB)
      }

      return nameA.localeCompare(nameB)
    })
    
    return result
  }, [items, filter, sortBy])

  const handleClearFilters = () => {
    setFilter("all")
    setSortBy("none")
    trigger("light")
  }

  useEffect(() => {
    const handleOpenModal = () => setIsCreateItemModalOpen(true)
    window.addEventListener("open-create-item", handleOpenModal)
    return () => window.removeEventListener("open-create-item", handleOpenModal)
  }, [])

  return (
    <main className="bg-[#131313] flex flex-col">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-[#131313]/80 backdrop-blur-xl border-b border-[#3d4a3d]/50 px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-5">
          <div className="flex items-center justify-between gap-4 mb-2">
            <div className="flex items-center gap-4 min-w-0">
              <Link
                href="/app"
                className="w-12 h-12 rounded-[1.25rem] bg-[#1c1b1b] flex items-center justify-center text-zinc-400 hover:text-[#53E076] transition-all active:scale-95 shrink-0 border border-[#3d4a3d]/60"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
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
                      className="bg-[#1c1b1b] text-xl font-black rounded px-2 outline-none ring-2 ring-indigo-500 w-full text-white"
                    />
                  ) : (
                    <>
                      <h1 
                        className="text-2xl font-black text-[#e5e2e1] truncate tracking-tight leading-none cursor-pointer"
                        onClick={() => {
                          if (isOwner) {
                            setEditTitle(list?.title || "")
                            setIsEditingTitle(true)
                          }
                        }}
                      >
                        {list?.title || "Carregando..."}
                      </h1>
                      {isOwner && (
                        <button
                          onClick={() => {
                            setEditTitle(list?.title || "")
                            setIsEditingTitle(true)
                          }}
                          className="p-1 text-zinc-500 hover:text-indigo-400 transition-colors shrink-0"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="w-2 h-2 rounded-full bg-[#53E076] animate-pulse" />
                  <span className="text-[10px] font-black text-zinc-500 tracking-wide">
                    {Object.keys(onlineUsers).length + 1} Ativos
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => {
                  trigger("light")
                  setIsChatOpen(true)
                }}
                className="w-10 h-10 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 border border-indigo-500/10"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => {
                  trigger("light")
                  router.push(`/app/lists/${listId}/map`)
                }}
                className="w-10 h-10 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all active:scale-95 border border-emerald-500/10"
              >
                <MapIcon className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wide">
                  Itens
                </span>
                <span className="text-sm font-black text-indigo-500 leading-none mt-1">
                  {(items || []).length}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wide">
                  Faltando
                </span>
                <span className="text-sm font-black text-rose-500 leading-none mt-1">
                  {pendingSum > 0 ? formatCurrency(pendingSum) : ""}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-zinc-500 tracking-wide">
                  Comprado
                </span>
                <span className="text-sm font-black text-emerald-500 leading-none mt-1">
                  {purchasedSum > 0 ? formatCurrency(purchasedSum) : ""}
                </span>
              </div>
            </div>

            <div
              className="flex items-center -space-x-2 cursor-pointer group shrink-0"
              onClick={() => setIsShareModalOpen(true)}
            >
              {otherCollaborators.slice(0, 4).map((collab, i) => (
                <div
                  key={collab.user_id || `collab-${i}`}
                  className="w-7 h-7 rounded-full border-2 border-[#0e0e0e] bg-zinc-800 overflow-hidden shadow-sm"
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
              <div className="w-7 h-7 rounded-full border-2 border-dashed border-zinc-800 flex items-center justify-center text-zinc-500 group-hover:text-[#53E076] group-hover:border-[#53E076] transition-all ml-1 shadow-inner">
                <UserPlus className="w-3 h-3" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1">
            <button
              onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-bold tracking-wide whitespace-nowrap transition-all border-2 ${filter === "pending" ? "bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20" : "bg-zinc-900 border-white/5 text-zinc-400"}`}
            >
              Faltando
            </button>
            <button
              onClick={() => setFilter(filter === "purchased" ? "all" : "purchased")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-bold tracking-wide whitespace-nowrap transition-all border-2 ${filter === "purchased" ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-zinc-900 border-white/5 text-zinc-400"}`}
            >
              Comprado
            </button>
            <button
              onClick={() => setSortBy(sortBy === "name" ? "none" : "name")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-bold tracking-wide whitespace-nowrap transition-all border-2 ${sortBy === "name" ? "bg-white text-black shadow-xl" : "bg-zinc-900 border-white/5 text-zinc-400"}`}
            >
              A-Z
            </button>
            <button
              onClick={handleClearFilters}
              className="px-6 py-3 rounded-2xl text-[10px] font-bold tracking-wide whitespace-nowrap transition-all border-2 bg-zinc-800 border-transparent text-zinc-500 hover:text-[#53E076]"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      {/* LISTA DE ITENS */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6 pb-32">
        {isLoading ? (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-zinc-50 dark:bg-zinc-900 rounded-[1.5rem] animate-pulse" />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-24 flex flex-col items-center justify-center gap-6 text-center">
            <ShoppingCart className="w-12 h-12 text-zinc-200" />
            <p className="text-zinc-400 font-bold">Nenhum item encontrado</p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex flex-col rounded-[2rem] transition-all duration-300 border-2",
                  expandedItemId === item.id 
                    ? "bg-[#1c1b1b] border-[#53E076]/40 shadow-2xl scale-[1.02] z-10" 
                    : "bg-[#1c1b1b]/40 border-[#3d4a3d]/20 hover:border-[#3d4a3d]/60 shadow-sm"
                )}
              >
                <div className="flex items-center justify-between p-3 px-4">
                  <div className="flex items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggleItem(item)}
                      className="transition-transform active:scale-90 shrink-0"
                    >
                      {item.is_purchased ? (
                        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                          <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                        </div>
                      ) : (
                        <Circle className="w-6 h-6 text-zinc-200 dark:text-zinc-800 hover:text-indigo-500 transition-colors" />
                      )}
                    </button>

                    <div
                      className="flex flex-col flex-1 cursor-pointer min-w-0"
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                    >
                      <span className={cn(
                        "font-black text-sm truncate tracking-tight",
                        item.is_purchased ? "line-through text-zinc-600" : "text-[#e5e2e1]"
                      )}>
                        {item.name}
                      </span>
                      
                      {expandedItemId !== item.id && (
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">
                            {item.quantity} {item.unit || "un"}
                          </span>
                          {item.category && (
                            <span className="text-[9px] font-black text-[#53E076] uppercase tracking-widest">
                              • {item.category}
                            </span>
                          )}
                          {Number(item.price) > 0 && (
                            <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                              • {formatCurrency((item.price || 0) * item.quantity)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                      className={cn(
                        "w-8 h-8 rounded-lg transition-all flex items-center justify-center",
                        expandedItemId === item.id 
                          ? "bg-[#1c1b1b] text-[#53E076] border border-[#3d4a3d]/60 shadow-inner" 
                          : "text-zinc-600 hover:bg-[#1c1b1b] hover:text-[#53E076]"
                      )}
                    >
                      {expandedItemId === item.id ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {expandedItemId === item.id && (
                  <div className="px-6 pb-8 pt-4 flex flex-col gap-6 border-t border-[#3d4a3d]/20 animate-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                      <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                        Nome do Item
                      </label>
                      <input
                        type="text"
                        defaultValue={item.name}
                        onBlur={(e) => {
                          if (e.target.value.trim() && e.target.value !== item.name) {
                            handleUpdateRichData(item.id, "name", e.target.value.trim())
                          }
                        }}
                        className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-black outline-none text-[#e5e2e1] focus:border-[#53E076]/40 shadow-inner"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                          Qtd / Medida
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateRichData(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-20 bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-black outline-none text-[#e5e2e1] focus:border-[#53E076]/40 shadow-inner"
                          />
                          <select
                            value={item.unit || "un"}
                            onChange={(e) => handleUpdateRichData(item.id, "unit", e.target.value)}
                            className="flex-1 bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-black outline-none text-[#e5e2e1] focus:border-[#53E076]/40 shadow-inner appearance-none"
                          >
                            <option value="un">un</option>
                            <option value="kg">kg</option>
                            <option value="g">g</option>
                            <option value="L">L</option>
                            <option value="ml">ml</option>
                            <option value="pct">pct</option>
                            <option value="cx">cx</option>
                            <option value="fd">fd</option>
                            <option value="dz">dz</option>
                          </select>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                          Preço Unitário
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0,00"
                            value={(item.price && item.price > 0) ? formatPriceMask(Math.round(item.price * 100).toString()) : ""}
                            onChange={(e) => {
                              const rawValue = e.target.value.replace(/\D/g, "")
                              const numericValue = parsePriceFromMask(rawValue)
                              handleUpdateRichData(item.id, "price", numericValue)
                            }}
                            className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 pl-10 px-4 text-sm font-black outline-none text-[#e5e2e1] focus:border-[#53E076]/40 shadow-inner"
                          />
                          <Coins className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                          Categoria / Corredor
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Hortifruti, Limpeza..."
                          value={item.category || ""}
                          onChange={(e) => handleUpdateRichData(item.id, "category", e.target.value)}
                          className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-black outline-none text-[#e5e2e1] focus:border-[#53E076]/40 shadow-inner"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 ml-1">
                          Observações
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: Marca preferida..."
                          value={item.notes || ""}
                          onChange={(e) => handleUpdateRichData(item.id, "notes", e.target.value)}
                          className="w-full bg-[#131313] border border-[#3d4a3d]/40 rounded-xl py-3 px-4 text-sm font-black outline-none text-[#e5e2e1] focus:border-[#53E076]/40 shadow-inner"
                        />
                      </div>
                    </div>

                    {item.is_purchased && (item as any).checked_by_profile && (
                      <div className="flex items-center gap-2 pt-2 border-t border-[#3d4a3d]/10">
                        <div className="w-6 h-6 rounded-lg bg-[#131313] overflow-hidden border border-[#3d4a3d]/60">
                          <Image
                            src={(item as any).checked_by_profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent((item as any).checked_by_profile.full_name || "U")}&background=131313&color=53E076`}
                            width={24} height={24} alt="Avatar"
                          />
                        </div>
                        <p className="text-[9px] font-black text-zinc-600 tracking-wide">
                          Adquirido por <span className="text-[#53E076]">{(item as any).checked_by_profile.full_name}</span>
                        </p>
                      </div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl bg-rose-500/5 text-rose-500 text-[10px] font-black uppercase tracking-widest border border-rose-500/10 hover:bg-rose-500/10 transition-all active:scale-[0.98]"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remover este item da lista
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        onAddManual={handleAddItem}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        isAiProcessing={isAiProcessing}
        setIsOcrScannerOpen={(val) => {
          setIsOcrScannerOpen(val);
          if (val) setIsCreateItemModalOpen(false); // Fecha o modal ao abrir scanner
        }}
        onOcrSuccess={handleOcrSuccess}
        voiceItems={voiceItems}
        showAiPreview={showAiPreview}
        setShowAiPreview={setShowAiPreview}
        confirmAiItems={confirmAiItems}
        trigger={trigger}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        listId={listId}
        listTitle={list?.title}
        collaborators={(collaborators || []) as Collaborator[]}
        isOwner={isOwner}
        currentUser={user}
        onAddCollaborator={(email, callbacks) => addCollaborator.mutate(email, callbacks)}
        onInviteUser={(email, callbacks) => inviteUser.mutate(email, callbacks)}
        onRemoveCollaborator={(userId) => {
          removeCollaborator.mutate(userId, {
            onSuccess: () => {
              if (userId === user?.id) router.push("/app")
            }
          })
        }}
      />

      <ListChat
        listId={listId}
        listTitle={list?.title}
        collaborators={collaborators as any}
        currentUser={user}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false)
        }}
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
