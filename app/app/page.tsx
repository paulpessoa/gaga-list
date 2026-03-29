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
  WifiOff,
  X,
  Loader2,
} from "lucide-react"
import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { VisionScanner } from "@/components/ui/vision-scanner"
import { ListCard } from "@/components/dashboard/list-card"
import { CreateListModal } from "@/components/dashboard/create-list-modal"
import { useAICreditCheck } from "@/hooks/use-ai-credit-check"

export default function AppPage() {
  const router = useRouter()
  const { data: lists, isLoading, isError } = useLists()
  const { data: user } = useUser()
  const { checkAndAct } = useAICreditCheck()
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

  // Filtros e Ordenação
  const [filter, setFilter] = useState<"all" | "mine" | "shared">("all")

  // Estados para Preview de Voz
  const [voiceTranscription, setVoiceTranscription] = useState("")
  const [voiceItems, setVoiceItems] = useState<any[]>([])
  const [suggestedTitle, setSuggestedTitle] = useState("")
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
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

  const filteredLists = useMemo(() => {
    if (!lists) return []
    
    let result = [...lists]

    // Filtragem
    if (filter === "mine") {
      result = result.filter(l => l.owner_id === user?.id)
    } else if (filter === "shared") {
      result = result.filter(l => l.owner_id !== user?.id)
    }

    // Ordenação Automática: Últimas atualizadas primeiro
    return result.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    )
  }, [lists, filter, user?.id])

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

        setVoiceTranscription(data.transcription)
        setVoiceItems(data.items || [])
        setSuggestedTitle(data.suggested_title || "")
        setVoiceHint(data.hint || null)
        setShowVoicePreview(true)

        if (!data.items || data.items.length === 0) {
          trigger("heavy")
        } else {
          trigger("success")
        }
      } catch (err) {
        alert("Erro ao processar áudio.")
      } finally {
        setIsAiProcessing(false)
      }
    },
    [trigger]
  )

  const reprocessVoiceTranscription = async () => {
    if (!voiceTranscription.trim()) return
    setIsAiProcessing(true)
    trigger("medium")
    try {
      const response = await fetch("/api/ai/suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: voiceTranscription })
      })
      const data = await response.json()
      setVoiceItems(data.items || [])
      setSuggestedTitle(data.suggested_title || suggestedTitle)
      setVoiceHint(data.hint || null)
      trigger("success")
    } catch (err) {
      alert("Erro ao reprocessar texto.")
    } finally {
      setIsAiProcessing(false)
    }
  }

  const confirmVoiceList = () => {
    if (voiceItems.length === 0) return
    setIsAiProcessing(true)

    const smartTitleFallback =
      voiceItems
        .slice(0, 2)
        .map((i) => i.name)
        .join(", ") + "..."
    
    const title = suggestedTitle || smartTitleFallback || "Nova Lista por Voz"

    // Mapear itens para o formato da API
    const initialItems = voiceItems.map(item => ({
      name: item.name,
      quantity: item.quantity || "1",
      unit: item.unit || null,
      category: item.category || null,
      price: item.price || 0,
      notes: item.notes || null
    }))

    createList.mutate(
      { 
        title, 
        color_theme: "indigo",
        initial_items: initialItems 
      } as any,
      {
        onSuccess: (newList) => {
          trigger("success")
          setIsCreateModalOpen(false)
          setShowVoicePreview(false)
          router.push(`/app/lists/${newList.id}`)
          setIsAiProcessing(false)
        },
        onError: () => {
          alert("Erro ao criar lista com itens.")
          setIsAiProcessing(false)
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
    
    const title = result.suggested_title || `Foto ${new Date().toLocaleDateString()}`

    // Mapear itens OCR para o formato da API
    const initialItems = items.map((item: any) => ({
      name: item.name,
      quantity: item.quantity || "1",
      category: item.category || null
    }))

    createList.mutate(
      {
        title: title,
        color_theme: "indigo",
        initial_items: initialItems
      } as any,
      {
        onSuccess: (newList) => {
          trigger("success")
          router.push(`/app/lists/${newList.id}`)
          setIsAiProcessing(false)
          setIsCreateModalOpen(false)
        },
        onError: () => {
          alert("Erro ao salvar itens da foto.")
          setIsAiProcessing(false)
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

  useEffect(() => {
    const handleOpenModal = () => setIsCreateModalOpen(true)
    window.addEventListener("open-create-list", handleOpenModal)
    return () => window.removeEventListener("open-create-list", handleOpenModal)
  }, [])

  return (
    <main className="min-h-screen p-5 md:p-10 max-w-4xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl py-4 -mx-5 px-5 flex flex-col gap-6 border-b border-zinc-100/50 dark:border-white/5 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
              Minhas Listas
            </h1>
            <p className="text-sm text-zinc-500 font-medium">
              {filteredLists.length} listas ativas • Gerencie seus itens
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
        </div>

        {/* Filtros de Abas */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl w-fit">
          <button
            onClick={() => { setFilter("all"); trigger("light"); }}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "all" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
          >
            Todas
          </button>
          <button
            onClick={() => { setFilter("mine"); trigger("light"); }}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "mine" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
          >
            Minhas
          </button>
          <button
            onClick={() => { setFilter("shared"); trigger("light"); }}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === "shared" ? "bg-white dark:bg-zinc-800 text-indigo-500 shadow-sm" : "text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
          >
            Outros
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-[180px] bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] animate-pulse" />
          ))
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500 font-bold">Erro ao carregar listas.</div>
        ) : filteredLists.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center text-zinc-200 dark:text-zinc-800">
              <Plus className="w-8 h-8" />
            </div>
            <p className="text-zinc-400 font-bold">Nenhuma lista encontrada.</p>
          </div>
        ) : (
          filteredLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              user={user}
              deleteList={deleteList}
              updateList={updateList}
              showDragHandle={false}
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
        startRecording={() => startRecording()}
        stopRecording={stopRecording}
        trigger={trigger}
        setIsOcrScannerOpen={setIsOcrScannerOpen}
        voiceTranscription={voiceTranscription}
        setVoiceTranscription={setVoiceTranscription}
        voiceItems={voiceItems}
        voiceHint={voiceHint}
        confirmVoiceList={confirmVoiceList}
        reprocessVoiceTranscription={reprocessVoiceTranscription}
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
