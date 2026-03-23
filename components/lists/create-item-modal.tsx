"use client"

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
  X,
  Search,
  Tag
} from "lucide-react"
import { Drawer } from "vaul"
import { useState, useMemo } from "react"
import { COMMON_GROCERY_ITEMS } from "@/lib/constants/grocery-items"
import { useAICreditCheck } from "@/hooks/use-ai-credit-check"

interface CreateItemModalProps {
  isOpen: boolean
  onClose: () => void
  onAddManual: (name: string, category?: string, unit?: string) => void
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
  isAiProcessing: boolean
  setIsOcrScannerOpen: (val: boolean) => void
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
  voiceItems,
  showAiPreview,
  setShowAiPreview,
  confirmAiItems,
  trigger
}: CreateItemModalProps) {
  const [itemName, setItemName] = useState("")
  const { checkAndAct } = useAICreditCheck()

  const suggestions = useMemo(() => {
    if (!itemName.trim()) return []
    return COMMON_GROCERY_ITEMS.filter((item) =>
      item.name.toLowerCase().includes(itemName.toLowerCase())
    ).slice(0, 5)
  }, [itemName])

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!itemName.trim()) return
    onAddManual(itemName)
    setItemName("")
  }

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
        <Drawer.Content className="bg-white dark:bg-zinc-950 flex flex-col rounded-t-[2.5rem] h-[auto] max-h-[90vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t border-zinc-200 dark:border-white/5 shadow-2xl">
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-t-[2.5rem] flex-1 overflow-y-auto custom-scrollbar pb-12">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-800 mb-8" />

            <div className="max-w-md mx-auto">
              {!showAiPreview ? (
                <>
                  <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                      <Plus className="w-8 h-8 text-indigo-500" />
                    </div>
                    <Drawer.Title className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                      Adicionar Item
                    </Drawer.Title>
                    <Drawer.Description className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                      Use voz, foto ou digite o nome do item.
                    </Drawer.Description>
                  </div>

                  <div className="flex flex-col gap-8">
                    {/* Atalhos de IA */}
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() =>
                          checkAndAct(1, () =>
                            isRecording ? stopRecording() : startRecording()
                          )
                        }
                        className={`p-6 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 transition-all border active:scale-95 relative overflow-hidden min-h-[140px] shadow-sm ${isRecording ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 shadow-inner"}`}
                      >
                        <div
                          className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isRecording ? "bg-white/20" : "bg-indigo-500/10 dark:bg-indigo-500/20"}`}
                        >
                          {isAiProcessing ? (
                            <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          ) : isRecording ? (
                            <Square className="w-5 h-5 fill-current text-white" />
                          ) : (
                            <Mic className="w-6 h-6 text-indigo-500" />
                          )}
                        </div>
                        <span className="text-[11px] font-black">
                          {isRecording ? "Parar" : "Voz"}
                        </span>
                        {/* <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-black">{isAiProcessing ? "Processando..." : isRecording ? "Parar" : "Via Áudio"}</span>
                          {!isAiProcessing && !isRecording && (
                            <span className="text-[8px] opacity-40 font-bold">Consome 1 grão</span>
                          )}
                        </div> */}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          checkAndAct(2, () => {
                            trigger("medium")
                            setIsOcrScannerOpen(true)
                          })
                        }
                        className="p-6 bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 hover:bg-white dark:hover:bg-zinc-900 transition-all border border-zinc-100 dark:border-white/5 active:scale-95 min-h-[140px] shadow-sm shadow-inner"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-emerald-500" />
                        </div>
                        <span className="text-[11px] font-black">Foto</span>
                      </button>
                    </div>

                    {/* Input Manual */}
                    <form onSubmit={handleManualSubmit} className="space-y-6">
                      <div className="space-y-3 relative">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                          Ou digite abaixo
                        </label>
                        <div className="relative">
                          <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                          <input
                            type="text"
                            placeholder="Ex: Leite Integral..."
                            value={itemName}
                            onChange={(e) => setItemName(e.target.value)}
                            className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-[1.5rem] py-5 pl-14 pr-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none transition-all shadow-inner font-bold text-base"
                          />
                        </div>

                        {/* Sugestões inline */}
                        {suggestions.length > 0 && (
                          <div className="absolute top-full left-0 right-0 mt-3 z-30 bg-white dark:bg-zinc-900 rounded-[1.5rem] shadow-2xl border border-zinc-100 dark:border-zinc-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
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

                      <button
                        type="submit"
                        disabled={!itemName.trim()}
                        className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                        <Plus className="w-4 h-4" /> Adicionar na Lista
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* Preview de Itens identificados pela IA */
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                      Confirmar Itens
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">
                      A IA identificou estes produtos:
                    </p>
                  </div>

                  <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-6 max-h-80 overflow-y-auto border border-zinc-100 dark:border-white/5 shadow-inner mb-8">
                    <ul className="space-y-3">
                      {voiceItems.map((item, i) => (
                        <li
                          key={i}
                          className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/50 p-4 rounded-2xl border border-zinc-100 dark:border-white/5"
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
                      className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
                    >
                      <Check className="w-5 h-5" /> Confirmar Tudo
                    </button>
                    <button
                      onClick={() => setShowAiPreview(false)}
                      className="w-full py-4 text-zinc-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" /> Cancelar
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
