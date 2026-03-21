// app/dashboard/page.tsx
"use client"

import {
  useLists,
  useCreateList,
  useDeleteList,
  useUpdateList
} from "@/hooks/use-lists"
import { useUser } from "@/hooks/use-user"
import { useHaptic } from "@/hooks/use-haptic"
import { useAudioRecorder } from "@/hooks/use-audio-recorder"
import { useNotifications } from "@/providers/notification-provider"
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
  Camera,
  Loader2,
  Square,
  Bell,
  Check,
  RotateCcw,
  UtensilsCrossed
} from "lucide-react"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { QRScanner } from "@/components/ui/qr-scanner"
import { VisionScanner } from "@/components/ui/vision-scanner"

export default function Dashboard() {
  const router = useRouter()
  const { data: lists, isLoading, isError, error } = useLists()
  const { data: user } = useUser()
  const { unreadCount } = useNotifications()
  const createList = useCreateList()
  const deleteList = useDeleteList()
  const updateList = useUpdateList()
  const { trigger } = useHaptic()
  const {
    isRecording,
    audioBlob,
    startRecording,
    stopRecording,
    setAudioBlob
  } = useAudioRecorder()

  const [isOffline, setIsOffline] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isOcrScannerOpen, setIsOcrScannerOpen] = useState(false)
  const [isAiProcessing, setIsAiProcessing] = useState(false)
  const [newListTitle, setNewListTitle] = useState("")
  const [editingListId, setEditingListId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState("")

  // Estados para Preview de Voz
  const [voiceTranscription, setVoiceTranscription] = useState("")
  const [voiceItems, setVoiceItems] = useState<any[]>([])
  const [showVoicePreview, setShowVoicePreview] = useState(false)

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

  const handleProcessVoice = useCallback(
    async (blob: Blob) => {
      setIsAiProcessing(true)
      trigger("medium")
      try {
        const formData = new FormData()
        formData.append("file", blob, "recording.webm")
        const response = await fetch("/api/ai/voice", {
          method: "POST",
          body: formData
        })
        if (!response.ok) throw new Error("Falha na transcrição")
        const data = await response.json()

        if (data.items && data.items.length > 0) {
          setVoiceTranscription(data.transcription)
          setVoiceItems(data.items)
          setShowVoicePreview(true)
        } else {
          alert("A IA não identificou itens claros. Tente novamente.")
        }
      } catch (err) {
        alert("Erro ao processar áudio.")
      } finally {
        setIsAiProcessing(false)
      }
    },
    [trigger]
  )

  const confirmVoiceList = () => {
    setIsAiProcessing(true)
    const title = voiceTranscription.slice(0, 25) + "..." || "Lista por Voz"
    createList.mutate(
      { title, color_theme: "indigo" },
      {
        onSuccess: async (newList) => {
          for (const item of voiceItems) {
            await fetch(`/api/lists/${newList.id}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.name,
                quantity: item.quantity || "1",
                category: item.category
              })
            })
          }
          trigger("success" as any)
          setIsAiProcessing(false)
          setIsCreateModalOpen(false)
          setShowVoicePreview(false)
          router.push(`/dashboard/lists/${newList.id}`)
        }
      }
    )
  }

  const handleOcrSuccess = async (result: any) => {
    setIsOcrScannerOpen(false)
    const items = result.items || []
    if (!items || items.length === 0) {
      alert("Nenhum item na foto.")
      return
    }
    setIsAiProcessing(true)
    createList.mutate(
      {
        title: `Foto ${new Date().toLocaleDateString()}`,
        color_theme: "indigo"
      },
      {
        onSuccess: async (newList) => {
          for (const item of items) {
            await fetch(`/api/lists/${newList.id}/items`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                name: item.name,
                quantity: item.quantity || "1",
                category: item.category
              })
            })
          }
          trigger("success" as any)
          setIsAiProcessing(false)
          setIsCreateModalOpen(false)
          router.push(`/dashboard/lists/${newList.id}`)
        }
      }
    )
  }

  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleProcessVoice(audioBlob)
      setAudioBlob(null)
    }
  }, [audioBlob, isRecording, handleProcessVoice, setAudioBlob])

  const handleCreateList = () => {
    trigger("medium")
    setIsCreateModalOpen(true)
  }
  const submitCreateList = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newListTitle.trim()) return
    createList.mutate(
      { title: newListTitle, color_theme: "indigo" },
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
    updateList.mutate(
      { listId, updates: { title: editTitle } },
      { onSuccess: () => setEditingListId(null) }
    )
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Minhas Listas
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            {lists?.length || 0} listas ativas • Gerencie seus itens
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link 
            href="/dashboard/recipes"
            onClick={() => trigger('light')}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95 flex items-center gap-2"
          >
            <UtensilsCrossed className="w-5 h-5" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Receitas</span>
          </Link>

          <Link 
            href="/dashboard/products"
            onClick={() => trigger('light')}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-all border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95 flex items-center gap-2"
          >
            <ShoppingBag className="w-5 h-5" />
            <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">Produtos</span>
          </Link>

          {isOffline && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-black uppercase tracking-widest">
              <WifiOff className="w-3 h-3" />
              <span>OFFLINE</span>
            </div>
          )}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <button
          onClick={handleCreateList}
          disabled={createList.isPending}
          className="glass-panel rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 min-h-[200px] border-dashed border-2 border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all group cursor-pointer"
        >
          <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-300">
            <Plus className="w-7 h-7 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              {createList.isPending ? "Criando..." : "Nova Lista"}
            </span>
            <span className="text-xs text-zinc-500 font-medium mt-1">
              Comece um novo projeto de compras
            </span>
          </div>
        </button>

        {isLoading ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-[2rem] p-8 min-h-[200px] animate-pulse"
            >
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
          <div className="col-span-full glass-panel rounded-[2rem] p-12 flex flex-col items-center justify-center border-red-500/20 gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center">
              <X className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Ops! Erro ao carregar listas
            </h3>
          </div>
        ) : (
          lists?.map((list: any) => {
            const totalItems = list.items?.length || 0
            const completedItems =
              list.items?.filter((i: any) => i.is_purchased).length || 0
            const progress =
              totalItems > 0 ? (completedItems / totalItems) * 100 : 0
            const isOwner = list.owner_id === user?.id
            return (
              <div
                key={list.id}
                onClick={() => {
                  trigger("light")
                  router.push(`/dashboard/lists/${list.id}`)
                }}
                className="glass-panel card-hover rounded-[2rem] p-6 flex flex-col justify-between min-h-[200px] cursor-pointer border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900/40 relative overflow-hidden group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4 overflow-hidden">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-2xl shadow-inner border border-indigo-500/10">
                      {list.icon || "🛒"}
                    </div>
                    <div className="flex flex-col min-w-0">
                      {editingListId === list.id ? (
                        <input
                          autoFocus
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => submitRename(list.id)}
                          onKeyDown={(e) =>
                            e.key === "Enter" && submitRename(list.id)
                          }
                          onClick={(e) => e.stopPropagation()}
                          className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-lg rounded px-2 py-0.5 outline-none ring-2 ring-indigo-500"
                        />
                      ) : (
                        <h3 className="font-black text-lg text-zinc-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors leading-tight">
                          {list.title}
                        </h3>
                      )}
                      <div className="flex items-center gap-2 mt-0.5">
                        <span
                          className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isOwner ? "bg-indigo-500/10 text-indigo-600" : "bg-amber-500/10 text-amber-600"}`}
                        >
                          {isOwner ? "Proprietário" : "Colaborador"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-400">
                    <span>Progresso</span>
                    <span className="text-zinc-900 dark:text-zinc-100">
                      {completedItems}/{totalItems} itens
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-zinc-200/50 dark:border-white/5">
                    <div
                      className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition-all duration-700 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRename(list.id, list.title)
                      }}
                      className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {isOwner && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          if (confirm("Mover para a lixeira?"))
                            deleteList.mutate(list.id)
                        }}
                        className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
                    Acessar <ChevronRight className="w-3 h-3 ml-1" />
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl border border-zinc-200 dark:border-white/5 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsCreateModalOpen(false)
                setShowVoicePreview(false)
              }}
              className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2"
            >
              <X className="w-5 h-5" />
            </button>

            {!showVoicePreview ? (
              <>
                <div className="mb-8 text-center sm:text-left">
                  <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 mx-auto sm:mx-0">
                    <ShoppingBag className="w-8 h-8 text-indigo-500" />
                  </div>
                  <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 leading-tight">
                    Nova Lista
                  </h2>
                  <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                    Organize suas compras com amigos e família.
                  </p>
                </div>
                <form
                  onSubmit={submitCreateList}
                  className="flex flex-col gap-6"
                >
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                      Nome da Lista
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Mercado da Semana..."
                      required
                      autoFocus
                      value={newListTitle}
                      onChange={(e) => setNewListTitle(e.target.value)}
                      className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4.5 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                  <div className="flex flex-col gap-3">
                    <button
                      type="submit"
                      disabled={
                        createList.isPending ||
                        !newListTitle.trim() ||
                        isAiProcessing
                      }
                      className="w-full py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {createList.isPending || isAiProcessing ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                      ) : (
                        "Criar Lista"
                      )}
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          isRecording ? stopRecording() : startRecording()
                        }
                        disabled={isAiProcessing}
                        className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all border active:scale-95 ${isRecording ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-white/5 hover:bg-zinc-200 dark:hover:bg-zinc-800"}`}
                      >
                        {isAiProcessing ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : isRecording ? (
                          <Square className="w-4 h-4 fill-current" />
                        ) : (
                          <Mic className="w-4 h-4 text-indigo-500" />
                        )}
                        {isAiProcessing
                          ? "Processando..."
                          : isRecording
                            ? "Parar"
                            : "Via Áudio"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          trigger("medium")
                          setIsOcrScannerOpen(true)
                        }}
                        disabled={isAiProcessing}
                        className="py-4 bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-all border border-zinc-200 dark:border-white/5 active:scale-95"
                      >
                        <Camera className="w-4 h-4 text-indigo-500" />
                        Via Foto
                      </button>
                    </div>
                  </div>
                </form>
              </>
            ) : (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="mb-6">
                  <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                    Confirmar Lista
                  </h2>
                  <p className="text-zinc-500 text-sm font-medium">
                    A IA identificou estes itens no seu áudio:
                  </p>
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-4 mb-6 max-h-48 overflow-y-auto border border-zinc-100 dark:border-white/5">
                  <p className="text-xs text-indigo-500 font-bold mb-3 uppercase tracking-widest italic">
                    &quot;{voiceTranscription}&quot;
                  </p>
                  <ul className="space-y-2">
                    {voiceItems.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm font-bold text-zinc-700 dark:text-zinc-300"
                      >
                        <Check className="w-4 h-4 text-emerald-500" />{" "}
                        {item.quantity} {item.name}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={confirmVoiceList}
                    disabled={isAiProcessing}
                    className="w-full py-4.5 bg-indigo-500 text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                  >
                    {isAiProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5" /> Criar Lista Agora
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowVoicePreview(false)}
                    className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-all"
                  >
                    <RotateCcw className="w-4 h-4" /> Gravar Novamente
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <VisionScanner
        mode="ocr"
        isOpen={isOcrScannerOpen}
        onClose={() => setIsOcrScannerOpen(false)}
        onScanSuccess={handleOcrSuccess}
      />
    </main>
  )
}
