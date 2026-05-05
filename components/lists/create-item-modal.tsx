"use client"

import { useState, useMemo, useRef } from "react"
import {
  ShoppingBag,
  Loader2,
  Square,
  Mic,
  Camera,
  CheckCircle2,
  RotateCcw,
  Check,
  Plus,
  Search,
  Tag,
  UploadCloud,
  AlertCircle,
  X
} from "lucide-react"
import { Drawer } from "vaul"
import { COMMON_GROCERY_ITEMS } from "@/lib/constants/grocery-items"
import { useAICreditCheck } from "@/hooks/use-ai-credit-check"
import { useAICosts } from "@/hooks/use-ai-costs"

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddManual: (name: string, category?: string, unit?: string) => void
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
  isAiProcessing: boolean
  setIsOcrScannerOpen: (val: boolean) => void
  onOcrSuccess: (data: any) => void
  voiceItems: any[]
  showAiPreview: boolean
  setShowAiPreview: (val: boolean) => void
  confirmAiItems: () => void
  trigger: (type?: any) => void
}

export function CreateItemModal({
  isOpen,
  onClose,
  onAddManual,
  isRecording,
  startRecording,
  stopRecording,
  isAiProcessing,
  setIsOcrScannerOpen,
  onOcrSuccess,
  voiceItems,
  showAiPreview,
  setShowAiPreview,
  confirmAiItems,
  trigger
}: CreateItemModalProps) {
  const [itemName, setItemName] = useState("")
  const { checkAndAct } = useAICreditCheck()
  const { costs } = useAICosts()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nativeCameraRef = useRef<HTMLInputElement>(null)
  const [isUploadingLocal, setIsUploadingLocal] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 3 * 1024 * 1024) {
      alert("Arquivo muito grande! O limite é de 3MB.")
      return
    }

    trigger("medium")
    setIsUploadingLocal(true)

    const reader = new FileReader()
    reader.onload = async () => {
      const base64 = reader.result as string
      try {
        const response = await fetch('/api/ai/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        const data = await response.json()
        if (data.items) {
          onOcrSuccess(data)
        } else {
          alert(data.error || "Erro ao processar imagem")
        }
      } catch (err) {
        alert("Erro na conexão com a IA.")
      } finally {
        setIsUploadingLocal(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const suggestions = useMemo(() => {
    if (!itemName.trim()) return []
    return COMMON_GROCERY_ITEMS.filter((item) =>
      item.name.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 4)
  }, [itemName])

  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setShowAiPreview(false)
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-white dark:bg-[#131313] flex flex-col rounded-t-[2.5rem] h-auto mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t border-zinc-200 dark:border-[#3d4a3d]/60 shadow-2xl">
          <div className="p-4 bg-white dark:bg-[#131313] rounded-t-[2.5rem] flex-1 overflow-y-auto custom-scrollbar pb-12">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-[#201f1f] mb-8" />
            
            <div className="max-w-md mx-auto">
              {!showAiPreview ? (
                <>
                  <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-[#1DB954]/10 dark:bg-[#1DB954]/20 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                      <ShoppingBag className="w-8 h-8 text-[#53E076]" />
                    </div>
                    <Drawer.Title className="text-3xl font-black text-zinc-900 dark:text-[#e5e2e1] mb-2 leading-tight">
                      Novo Item
                    </Drawer.Title>
                    <Drawer.Description className="text-zinc-500 dark:text-[#bccbb9] text-sm font-medium">
                      Escolha uma opção para adicionar.
                    </Drawer.Description>
                  </div>

                  <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => checkAndAct(costs.cost_voice, () => (isRecording ? stopRecording() : startRecording()))}
                        disabled={isAiProcessing}
                        className={`p-4 w-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 transition-all border active:scale-95 relative overflow-hidden min-h-[120px] shadow-sm ${isRecording ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-zinc-50 dark:bg-[#1c1b1b]/50 text-zinc-600 dark:text-[#bccbb9] border-zinc-100 dark:border-[#3d4a3d]/60 hover:bg-white dark:hover:bg-zinc-900 shadow-inner"}`}
                      >
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors ${isRecording ? 'bg-white/20' : 'bg-[#1DB954]/10 dark:bg-[#1DB954]/20'}`}>
                          {isAiProcessing ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : isRecording ? (
                            <Square className="w-4 h-4 fill-current text-white" />
                          ) : (
                            <Mic className="w-5 h-5 text-[#53E076]" />
                          )}
                        </div>
                        <span className="text-[9px] font-black leading-tight text-center">Via<br/>Áudio</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          trigger("medium")
                          checkAndAct(costs.cost_ocr, () => setIsOcrScannerOpen(true))
                        }}
                        disabled={isAiProcessing}
                        className="p-4 w-full bg-zinc-50 dark:bg-[#1c1b1b]/50 text-zinc-600 dark:text-[#bccbb9] rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 hover:bg-white dark:hover:bg-zinc-900 transition-all border border-zinc-100 dark:border-[#3d4a3d]/60 active:scale-95 min-h-[120px] shadow-sm shadow-inner"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-[#1DB954]/10 dark:bg-[#1DB954]/20 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-[#53E076]" />
                        </div>
                        <span className="text-[9px] font-black leading-tight text-center">Foto A<br/>(Scanner)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => checkAndAct(costs.cost_ocr, () => nativeCameraRef.current?.click())}
                        disabled={isAiProcessing || isUploadingLocal}
                        className="p-4 w-full bg-zinc-50 dark:bg-[#1c1b1b]/50 text-zinc-600 dark:text-[#bccbb9] rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-2 hover:bg-white dark:hover:bg-zinc-900 transition-all border border-zinc-100 dark:border-[#3d4a3d]/60 active:scale-95 min-h-[120px] shadow-sm shadow-inner"
                      >
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center">
                          <Camera className="w-5 h-5 text-indigo-500" />
                        </div>
                        <span className="text-[9px] font-black leading-tight text-center">Foto B<br/>(Nativa)</span>
                      </button>
                    </div>

                    <input 
                      type="file" 
                      ref={nativeCameraRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                    />

                    <input 
                      type="file" 
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />

                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => checkAndAct(costs.cost_ocr, () => fileInputRef.current?.click())}
                        disabled={isAiProcessing || isUploadingLocal}
                        className="w-full py-4 bg-zinc-100 dark:bg-[#1c1b1b] text-zinc-600 dark:text-[#bccbb9] rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-zinc-200 dark:hover:bg-zinc-900 transition-all border border-zinc-200 dark:border-[#3d4a3d]/60 active:scale-95"
                      >
                        {isUploadingLocal ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-[#53E076]" />
                            Processando Imagem...
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-4 h-4 text-[#53E076]" />
                            Ou suba um arquivo de imagem
                          </>
                        )}
                      </button>
                      <div className="flex items-center justify-center gap-2 py-1">
                        <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest opacity-60">
                          Máximo de 3MB • PNG, JPG ou WEBP
                        </span>
                      </div>
                    </div>

                    <form 
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (itemName.trim()) {
                          onAddManual(itemName.trim())
                          setItemName("")
                        }
                      }} 
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                          Ou digite manualmente
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Ex: 2kg de arroz..."
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-[#1c1b1b] border-2 border-transparent focus:border-[#53E076]/50 rounded-2xl py-5 px-6 text-zinc-900 dark:text-[#e5e2e1] placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none transition-all shadow-inner font-bold text-base"
                          />

                          {suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-3 z-30 bg-white dark:bg-[#1c1b1b] rounded-[1.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden">
                              {suggestions.map((s, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => {
                                    onAddManual(s.name, s.category, s.unit)
                                    setItemName("")
                                  }}
                                  className="w-full flex items-center justify-between p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-left transition-colors border-b border-zinc-50 dark:border-zinc-800 last:border-0"
                                >
                                  <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-[#1DB954]/5 flex items-center justify-center text-lg">
                                      🛒
                                    </div>
                                    <div>
                                      <p className="font-black text-zinc-900 dark:text-white text-sm tracking-tight uppercase">{s.name}</p>
                                      <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest opacity-60">{s.category}</p>
                                    </div>
                                  </div>
                                  <Plus className="w-5 h-5 text-[#53E076]/30" />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={!itemName.trim() || isAiProcessing}
                        className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        <Plus className="w-4 h-4" />
                        Adicionar Item
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-[#e5e2e1] mb-2 tracking-tight">
                      Confirmar Itens
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">
                      A IA identificou estes produtos:
                    </p>
                  </div>
                  
                  <div className="bg-zinc-50 dark:bg-[#1c1b1b] rounded-[2.5rem] p-6 max-h-80 overflow-y-auto border border-zinc-100 dark:border-[#3d4a3d]/60 shadow-inner mb-8">
                    <ul className="space-y-3">
                      {voiceItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-[#bccbb9] bg-white dark:bg-[#201f1f]/50 p-4 rounded-2xl border border-zinc-100 dark:border-[#3d4a3d]/60"
                        >
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />{" "}
                          <span className="flex-1">{item.name}</span>
                          {(item.quantity || item.unit) && (
                            <span className="text-[10px] bg-zinc-100 dark:bg-zinc-700 px-2 py-1 rounded-md text-zinc-500">
                              {item.quantity} {item.unit}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={confirmAiItems}
                      disabled={isAiProcessing || voiceItems.length === 0}
                      className="w-full py-5 bg-[#1DB954] text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAiProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Adicionar na Lista
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowAiPreview(false)}
                      className="w-full py-4 text-zinc-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" /> Tentar Novamente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
