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
  Filter,
  GripVertical
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { useUser } from "@/hooks/use-user"
import { ShareModal } from "@/components/lists/share-modal"
import { ListChat } from "@/components/lists/list-chat"
import { Collaborator } from "@/types"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Reorder } from "framer-motion"

import { useAICreditCheck } from "@/hooks/use-ai-credit-check"
import { VisionScanner } from "@/components/ui/vision-scanner"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { CreateItemModal } from "@/components/lists/create-item-modal"
import { cn, formatCurrency } from "@/lib/utils"

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
  const [chatTarget, setChatTarget] = useState<
    | { id: string; full_name: string | null; avatar_url: string | null }
    | undefined
  >(undefined)
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null)
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [editTitle, setEditTitle] = useState("")

  // Estado local para Reordenação (Drag & Drop)
  const [localItems, setLocalItems] = useState<any[]>([])

  const isOwner = list?.owner_id === user?.id

  // Sincroniza estado local com os dados do React Query
  useEffect(() => {
    if (items) {
      const sorted = [...items].sort((a, b) => (a.position || 0) - (b.position || 0))
      setLocalItems(sorted)
    }
  }, [items])

  const handleReorder = (newOrder: any[]) => {
    if (!isOwner) return
    setLocalItems(newOrder)
    
    // Atualiza posições no banco
    newOrder.forEach((item, index) => {
      if (item.position !== index) {
        updateItem.mutate({
          itemId: item.id,
          updates: { position: index } as any
        })
      }
    })
    trigger("light")
  }

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

  const handleAddItem = (name: string, category?: string, unit?: string) => {
    if (!name.trim()) return
    trigger("medium")
    createItem.mutate({
      name: name.trim(),
      category: category || null,
      unit: unit || null
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
    trigger("heavy")
    deleteItem.mutate(itemId)
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
      localItems.filter(i => !i.is_purchased).reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [localItems]
  )

  const purchasedSum = useMemo(
    () =>
      localItems.filter(i => i.is_purchased).reduce(
        (acc, item) => acc + (item.price || 0) * (item.quantity || 1),
        0
      ),
    [localItems]
  )

  const filteredItems = useMemo(() => {
    let result = [...localItems]
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
  }, [localItems, filter, sortBy])

  const handleClearFilters = () => {
    setFilter("all")
    setSortBy("none")
    trigger("light")
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-32 transition-colors duration-300">
      {/* HEADER */}
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
                  {localItems.length}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Faltando
                </span>
                <span className="text-sm font-black text-rose-500 leading-none mt-1">
                  {formatCurrency(pendingSum)}
                </span>
              </div>
              <div className="h-6 w-px bg-zinc-100 dark:bg-zinc-800 mx-1" />
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Comprado
                </span>
                <span className="text-sm font-black text-emerald-500 leading-none mt-1">
                  {formatCurrency(purchasedSum)}
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

          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1">
            <button
              onClick={() => setFilter(filter === "pending" ? "all" : "pending")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${filter === "pending" ? "bg-rose-500 border-rose-500 text-white shadow-xl shadow-rose-500/20" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
            >
              Faltando
            </button>
            <button
              onClick={() => setFilter(filter === "purchased" ? "all" : "purchased")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${filter === "purchased" ? "bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
            >
              Comprado
            </button>
            <div className="w-px h-4 bg-zinc-100 dark:bg-zinc-800 shrink-0 mx-1" />
            <button
              onClick={() => setSortBy(sortBy === "name" ? "none" : "name")}
              className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 ${sortBy === "name" ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-xl" : "bg-white dark:bg-zinc-900 border-zinc-100 dark:border-white/5 text-zinc-400"}`}
            >
              A-Z
            </button>
            <button
              onClick={handleClearFilters}
              className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border-2 bg-zinc-100 dark:bg-zinc-800 border-transparent text-zinc-500 hover:text-indigo-500"
            >
              Limpar
            </button>
          </div>
        </div>
      </header>

      {/* LISTA DE ITENS */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-6">
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
          <Reorder.Group
            axis="y"
            values={localItems}
            onReorder={handleReorder}
            className="flex flex-col gap-4"
          >
            {filteredItems.map((item) => (
              <Reorder.Item
                key={item.id}
                value={item}
                dragListener={isOwner && expandedItemId === null}
                className={cn(
                  "flex flex-col rounded-[1.5rem] transition-all duration-300 border list-none",
                  expandedItemId === item.id 
                    ? "bg-zinc-50/50 dark:bg-zinc-900/30 border-indigo-500/30 shadow-lg scale-[1.02] z-10" 
                    : "bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 hover:border-zinc-200 dark:hover:border-zinc-800 shadow-sm"
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
                      {expandedItemId === item.id ? (
                        <input
                          autoFocus
                          defaultValue={item.name}
                          onBlur={(e) => {
                            if (e.target.value.trim() && e.target.value !== item.name) {
                              handleUpdateRichData(item.id, "name", e.target.value.trim())
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value.trim()
                              if (val && val !== item.name) {
                                handleUpdateRichData(item.id, "name", val)
                              }
                              setExpandedItemId(null)
                            }
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="bg-transparent text-sm font-black text-zinc-900 dark:text-white outline-none ring-2 ring-indigo-500/20 rounded px-1 -ml-1 w-full"
                        />
                      ) : (
                        <span className={cn(
                          "font-bold text-sm truncate",
                          item.is_purchased ? "line-through text-zinc-400 dark:text-zinc-600" : "text-zinc-900 dark:text-zinc-100"
                        )}>
                          {item.name}
                        </span>
                      )}
                      
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                          {item.quantity} {item.unit || "un"}
                        </span>
                        {item.price > 0 && (
                          <span className="text-[9px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-tight">
                            • {formatCurrency(item.price * item.quantity)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    {isOwner && expandedItemId === null && (
                      <div className="p-2 text-zinc-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing">
                        <GripVertical className="w-4 h-4" />
                      </div>
                    )}
                    
                    <button
                      onClick={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
                      className={cn(
                        "p-2 rounded-xl transition-all",
                        expandedItemId === item.id ? "bg-indigo-500 text-white" : "text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900"
                      )}
                    >
                      {expandedItemId === item.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {expandedItemId === item.id && (
                  <div className="px-5 pb-6 pt-2 flex flex-col gap-5 border-t border-zinc-100 dark:border-zinc-900/50 animate-in slide-in-from-top-2 duration-300">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[10px] font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-500 ml-1">
                            Qtd / Medida
                          </label>
                          <button
                            onClick={() => handleDeleteItem(item.id)}
                            className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600"
                          >
                            <Trash2 className="w-3 h-3" />
                            Excluir
                          </button>
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleUpdateRichData(item.id, "quantity", parseFloat(e.target.value) || 0)}
                            className="w-16 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 px-3 text-sm font-bold outline-none"
                          />
                          <input
                            type="text"
                            placeholder="un, kg, L..."
                            value={item.unit || ""}
                            onChange={(e) => handleUpdateRichData(item.id, "unit", e.target.value)}
                            className="flex-1 bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 px-3 text-sm font-bold outline-none"
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
                            onChange={(e) => handleUpdateRichData(item.id, "price", parseFloat(e.target.value) || 0)}
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-xl py-2.5 pl-10 px-3 text-sm font-bold outline-none"
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
                        placeholder="Ex: Marca preferida..."
                        value={item.notes || ""}
                        onChange={(e) => handleUpdateRichData(item.id, "notes", e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-2xl py-3 px-4 text-sm font-medium outline-none h-16 resize-none"
                      />
                    </div>

                    {item.is_purchased && item.checked_by_profile && (
                      <div className="flex items-center gap-2 pt-1">
                        <div className="w-5 h-5 rounded-full bg-zinc-100 overflow-hidden">
                          <Image
                            src={item.checked_by_profile.avatar_url || `https://ui-avatars.com/api/?name=${item.checked_by_profile.full_name}&background=6366f1&color=fff`}
                            width={20} height={20} alt="Avatar"
                          />
                        </div>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">
                          Pegado por {item.checked_by_profile.full_name}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </Reorder.Item>
            ))}
          </Reorder.Group>
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setIsCreateItemModalOpen(true)}
        className="fixed bottom-32 left-8 w-16 h-16 bg-indigo-600 dark:bg-white text-white dark:text-indigo-600 rounded-[2rem] flex items-center justify-center shadow-2xl z-40 border-4 border-white dark:border-indigo-900"
      >
        <Plus className="w-8 h-8" />
      </button>

      <CreateItemModal
        isOpen={isCreateItemModalOpen}
        onClose={() => setIsCreateItemModalOpen(false)}
        onAddManual={handleAddItem}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        isAiProcessing={isAiProcessing}
        setIsOcrScannerOpen={setIsOcrScannerOpen}
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
