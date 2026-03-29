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
import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { VisionScanner } from "@/components/ui/vision-scanner"
import { ListCard } from "@/components/dashboard/list-card"
import { CreateListModal } from "@/components/dashboard/create-list-modal"
import { useAICreditCheck } from "@/hooks/use-ai-credit-check"

import { Reorder } from "framer-motion"

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

  // Estados para Preview de Voz
  const [voiceTranscription, setVoiceTranscription] = useState("")
  const [voiceItems, setVoiceItems] = useState<any[]>([])
  const [suggestedTitle, setSuggestedTitle] = useState("")
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const [showVoicePreview, setShowVoicePreview] = useState(false)

  // Estado local para Reordenação (Drag & Drop)
  const [localLists, setLocalLists] = useState<any[]>([])

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

  // Sincroniza estado local com os dados do React Query
  useEffect(() => {
    if (lists) {
      const sorted = [...lists].sort((a, b) => (a.position || 0) - (b.position || 0))
      setLocalLists(sorted) // eslint-disable-line react-hooks/set-state-in-effect
    }
  }, [lists])

  const handleReorder = (newOrder: any[]) => {
    setLocalLists(newOrder)
    
    // Atualiza posições no banco
    newOrder.forEach((list, index) => {
      if (list.position !== index) {
        updateList.mutate({
          listId: list.id,
          updates: { position: index } as any
        })
      }
    })
    trigger("light")
  }

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

  return (
    <main className="min-h-screen p-5 md:p-10 max-w-4xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl py-4 -mx-5 px-5 flex items-start justify-between border-b border-zinc-100/50 dark:border-white/5 transition-all">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Minhas Listas
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            {localLists.length} listas ativas • Gerencie seus itens
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 auto-rows-fr">
        <button
          onClick={handleCreateList}
          disabled={createList.isPending}
          className="glass-panel rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 min-h-[140px] border-dashed border-2 border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-zinc-900/20 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 transition-all group cursor-pointer"
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-500 transition-all duration-300">
            <Plus className="w-6 h-6 text-indigo-600 dark:text-indigo-400 group-hover:text-white transition-colors" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {createList.isPending ? "Criando..." : "Nova Lista"}
            </span>
          </div>
        </button>

        {isLoading ? (
          [1, 2].map((i) => (
            <div key={i} className="h-[180px] bg-zinc-50 dark:bg-zinc-900 rounded-[2rem] animate-pulse" />
          ))
        ) : isError ? (
          <div className="col-span-full py-12 text-center text-rose-500 font-bold">Erro ao carregar listas.</div>
        ) : (
          <Reorder.Group
            axis="y"
            values={localLists}
            onReorder={handleReorder}
            className="flex flex-col gap-5 md:contents"
          >
            {localLists.map((list) => (
              <Reorder.Item
                key={list.id}
                value={list}
                className="list-none"
              >
                <ListCard
                  list={list}
                  user={user}
                  deleteList={deleteList}
                  updateList={updateList}
                  showDragHandle={list.owner_id === user?.id}
                />
              </Reorder.Item>
            ))}
          </Reorder.Group>
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
