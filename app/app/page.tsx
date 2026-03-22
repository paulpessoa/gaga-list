// app/app/page.tsx
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
import { ListCard } from "@/components/dashboard/list-card"
import { CreateListModal } from "@/components/dashboard/create-list-modal"

export default function AppPage() {
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
          router.push(`/app/lists/${newList.id}`)
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
          router.push(`/app/lists/${newList.id}`)
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

  const sortedLists = [...(lists || [])].sort((a, b) => a.title.localeCompare(b.title))

  return (
    <main className="min-h-screen p-5 md:p-10 max-w-4xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl py-4 -mx-5 px-5 flex items-start justify-between border-b border-zinc-100/50 dark:border-white/5 transition-all">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Minhas Listas
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            {lists?.length || 0} listas ativas • Gerencie seus itens
          </p>
        </div>

        <div className="flex items-center gap-2">
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
            <span className="text-xs text-zinc-500 font-medium mt-1 text-center">
              Crie via voz, foto ou manual
            </span>
          </div>
        </button>

        {isLoading ? (
          [1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass-panel rounded-[2.5rem] p-8 min-h-[180px] flex flex-col gap-4 animate-pulse bg-zinc-50/50 dark:bg-zinc-900/20 border border-zinc-100 dark:border-white/5"
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded-2xl" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-zinc-200 dark:bg-zinc-800 rounded-full w-3/4" />
                  <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full w-1/2" />
                </div>
              </div>
              <div className="mt-auto h-10 bg-zinc-200 dark:bg-zinc-800 rounded-xl w-full" />
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
          sortedLists.map((list: any) => (
            <ListCard
              key={list.id}
              list={list}
              user={user}
              deleteList={deleteList}
              updateList={updateList}
            />
          ))
        )}
      </div>

      <CreateListModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        showVoicePreview={showVoicePreview}
        setShowVoicePreview={setShowVoicePreview}
        newListTitle={newListTitle}
        setNewListTitle={setNewListTitle}
        isAiProcessing={isAiProcessing}
        submitCreateList={submitCreateList}
        isRecording={isRecording}
        startRecording={startRecording}
        stopRecording={stopRecording}
        trigger={trigger}
        setIsOcrScannerOpen={setIsOcrScannerOpen}
        voiceTranscription={voiceTranscription}
        voiceItems={voiceItems}
        confirmVoiceList={confirmVoiceList}
        createListPending={createList.isPending}
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
