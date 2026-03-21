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
  X
} from "lucide-react"

interface CreateListModalProps {
  isOpen: boolean
  onClose: () => void
  showVoicePreview: boolean
  setShowVoicePreview: (val: boolean) => void
  newListTitle: string
  setNewListTitle: (val: string) => void
  isAiProcessing: boolean
  submitCreateList: (e: React.FormEvent) => void
  isRecording: boolean
  startRecording: () => void
  stopRecording: () => void
  trigger: (type?: any) => void
  setIsOcrScannerOpen: (val: boolean) => void
  voiceTranscription: string
  voiceItems: any[]
  confirmVoiceList: () => void
  createListPending: boolean
}

export function CreateListModal({
  isOpen,
  onClose,
  showVoicePreview,
  setShowVoicePreview,
  newListTitle,
  setNewListTitle,
  isAiProcessing,
  submitCreateList,
  isRecording,
  startRecording,
  stopRecording,
  trigger,
  setIsOcrScannerOpen,
  voiceTranscription,
  voiceItems,
  confirmVoiceList,
  createListPending
}: CreateListModalProps) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-white dark:bg-zinc-950 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl border border-zinc-200 dark:border-white/5 animate-in zoom-in-95 duration-200">
        <button
          onClick={() => {
            onClose()
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
            <form onSubmit={submitCreateList} className="flex flex-col gap-6">
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
                  disabled={createListPending || !newListTitle.trim() || isAiProcessing}
                  className="w-full py-4.5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {createListPending || isAiProcessing ? (
                    <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    "Criar Lista"
                  )}
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => (isRecording ? stopRecording() : startRecording())}
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
                    {isAiProcessing ? "Processando..." : isRecording ? "Parar" : "Via Áudio"}
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
  )
}
