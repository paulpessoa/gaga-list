"use client"

import { use, useState, useMemo, useEffect, useRef } from "react"
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
  useUpdateList
} from "@/hooks/use-lists"
import {
  Plus,
  CheckCircle2,
  Circle,
  Trash2,
  ArrowLeft,
  ShoppingCart,
  Navigation,
  MessageSquare,
  MessageCircle,
  Map as MapIcon,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  X,
  User,
  UserPlus,
  Clock,
  Coins
} from "lucide-react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { useUser } from "@/hooks/use-user"
import { ShareModal } from "@/components/lists/share-modal"
import { ListChat } from "@/components/lists/list-chat"
import { Collaborator, Item } from "@/types"
import Image from "next/image"
import {
  COMMON_GROCERY_ITEMS,
  GrocerySuggestion
} from "@/lib/constants/grocery-items"
import { useRouter } from "next/navigation"

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

  const [newItemName, setNewItemName] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "purchased">("all")
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

  const pendingCount = useMemo(
    () => items?.filter((i) => !i.is_purchased).length || 0,
    [items]
  )

  const suggestions = useMemo(() => {
    if (!newItemName.trim()) return []
    return COMMON_GROCERY_ITEMS.filter((item) =>
      item.name.toLowerCase().includes(newItemName.toLowerCase())
    ).slice(0, 5)
  }, [newItemName])

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

  const filteredItems = items?.filter((item) => {
    if (filter === "all") return true
    if (filter === "pending") return !item.is_purchased
    if (filter === "purchased") return item.is_purchased
    return true
  })

  const isOwner = list?.owner_id === user?.id

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col pb-32 transition-colors duration-300">
      {/* HEADER PREMIUM UX/UI */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-b border-zinc-100 dark:border-zinc-900 px-6 py-4">
        <div className="max-w-4xl mx-auto flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                href="/app"
                className="p-2 -ml-2 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                {isEditingTitle ? (
                  <input
                    autoFocus
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onBlur={() => {
                      if (editTitle.trim() && editTitle !== list?.title) {
                        updateList.mutate({
                          listId,
                          updates: { title: editTitle }
                        })
                      }
                      setIsEditingTitle(false)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        if (editTitle.trim() && editTitle !== list?.title) {
                          updateList.mutate({
                            listId,
                            updates: { title: editTitle }
                          })
                        }
                        setIsEditingTitle(false)
                      }
                      if (e.key === "Escape") setIsEditingTitle(false)
                    }}
                    className="bg-zinc-100 dark:bg-zinc-900 text-lg font-black rounded px-2 outline-none ring-2 ring-indigo-500"
                  />
                ) : (
                  <h1
                    onClick={() => {
                      setEditTitle(list?.title || "")
                      setIsEditingTitle(true)
                    }}
                    className="text-lg font-black text-zinc-900 dark:text-white tracking-tight leading-tight cursor-pointer hover:text-indigo-500 transition-colors"
                  >
                    {list?.title || "Carregando..."}
                  </h1>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                    {pendingCount}{" "}
                    {pendingCount === 1 ? "restante" : "restantes"}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div
                className="flex items-center -space-x-2 cursor-pointer group hover:opacity-80 transition-opacity"
                onClick={() => setIsShareModalOpen(true)}
              >
                {otherCollaborators.slice(0, 3).map((collab, i) => (
                  <div
                    key={collab.user_id || `collab-${i}`}
                    className="w-9 h-9 rounded-full border-2 border-white dark:border-zinc-950 bg-zinc-100 dark:bg-zinc-800 overflow-hidden shadow-sm transition-transform group-hover:scale-105"
                    style={{ zIndex: 10 - i }}
                  >
                    <Image
                      src={
                        collab.profiles?.avatar_url ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(collab.profiles?.full_name || "U")}&background=6366f1&color=fff`
                      }
                      width={36}
                      height={36}
                      className="object-cover"
                      alt="Avatar"
                    />
                  </div>
                ))}
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-zinc-200 dark:border-zinc-800 flex items-center justify-center text-zinc-400 group-hover:text-indigo-500 group-hover:border-indigo-500 transition-all ml-3 shadow-inner">
                  <UserPlus className="w-4 h-4" />
                </div>
              </div>

              <div className="h-8 w-px bg-zinc-100 dark:bg-zinc-900 mx-1" />

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => {
                    trigger("light")
                    setIsChatOpen(true)
                  }}
                  className="w-10 h-10 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-95 shadow-sm border border-indigo-500/20"
                >
                  <MessageCircle className="w-5 h-5" />
                </button>
                <Link
                  href={`/app/lists/${listId}/map`}
                  onClick={() => trigger("light")}
                  className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-zinc-500 dark:text-zinc-400 hover:bg-zinc-900 dark:hover:bg-white hover:text-white dark:hover:text-black transition-all active:scale-95 shadow-sm border border-zinc-200 dark:border-zinc-800"
                >
                  <MapIcon className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto w-full p-6 flex flex-col gap-8">
        {/* ADD ITEM FORM COM AUTOCOMPLETE */}
        <div className="relative">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleAddItem(newItemName)
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Ex: Leite, Pão, Cerveja..."
                value={newItemName}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setNewItemName(e.target.value)
                  setShowSuggestions(true)
                }}
                className="w-full bg-zinc-100 dark:bg-zinc-900/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none transition-all shadow-inner"
              />
              <ShoppingCart className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-300 dark:text-zinc-700 pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={createItem.isPending || !newItemName.trim()}
              className="w-14 h-14 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 active:scale-95"
            >
              <Plus className="w-7 h-7" />
            </button>
          </form>

          {/* Sugestões de Autocomplete */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-16 mt-2 z-30 bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleAddItem(s.name, s.category, s.unit)}
                  className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">🛒</span>
                    <div>
                      <p className="font-bold text-zinc-900 dark:text-white text-sm">
                        {s.name}
                      </p>
                      <p className="text-[10px] text-zinc-500 uppercase font-black">
                        {s.category}
                      </p>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-zinc-300" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FILTROS */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {(["all", "pending", "purchased"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${filter === f ? "bg-zinc-900 dark:bg-white text-white dark:text-black shadow-lg" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-zinc-900 dark:hover:text-white"}`}
            >
              {f === "all" ? "Tudo" : f === "pending" ? "Faltando" : "Comprado"}
            </button>
          ))}
        </div>

        {/* LISTA DE ITENS */}
        <div className="flex flex-col gap-3">
          {isLoading ? (
            [1, 2, 3].map((i) => (
              <div
                key={i}
                className="glass-panel rounded-2xl p-6 h-16 animate-pulse"
              />
            ))
          ) : filteredItems?.length === 0 ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center mb-2">
                <ShoppingCart className="w-10 h-10 text-zinc-200 dark:text-zinc-800" />
              </div>
              <div>
                <p className="text-zinc-400 font-bold">
                  Nenhum item encontrado
                </p>
                <p className="text-zinc-500 text-xs">
                  Comece a preencher sua lista!
                </p>
              </div>
            </div>
          ) : (
            filteredItems?.map((item: any) => (
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

                    <div className="flex items-center justify-between pt-2">
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="flex items-center gap-2 py-2.5 px-4 rounded-xl text-red-500 hover:bg-red-500/10 transition-colors text-[10px] font-black uppercase tracking-widest"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remover Item
                      </button>

                      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-400">
                        <Clock className="w-3.5 h-3.5" />
                        Criado {new Date(item.created_at).toLocaleDateString()}
                      </div>
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
    </main>
  )
}
