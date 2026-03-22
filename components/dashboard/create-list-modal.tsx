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
  Plus
} from "lucide-react"
import { Drawer } from "vaul"

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
  setVoiceTranscription: (val: string) => void
  voiceItems: any[]
  voiceHint: string | null
  confirmVoiceList: () => void
  reprocessVoiceTranscription: () => void
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
  setVoiceTranscription,
  voiceItems,
  voiceHint,
  confirmVoiceList,
  reprocessVoiceTranscription,
  createListPending
}: CreateListModalProps) {
  return (
    <Drawer.Root 
      open={isOpen} 
      onOpenChange={(open) => {
        if (!open) {
          onClose()
          setShowVoicePreview(false)
        }
      }}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-white dark:bg-zinc-950 flex flex-col rounded-t-[2.5rem] h-[auto] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t border-zinc-200 dark:border-white/5 shadow-2xl">
          <div className="p-4 bg-white dark:bg-zinc-950 rounded-t-[2.5rem] flex-1 overflow-y-auto custom-scrollbar pb-12">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-zinc-300 dark:bg-zinc-800 mb-8" />
            
            <div className="max-w-md mx-auto">
              {!showVoicePreview ? (
                <>
                  <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-indigo-500/10 dark:bg-indigo-500/20 rounded-3xl flex items-center justify-center mb-6 mx-auto">
                      <ShoppingBag className="w-8 h-8 text-indigo-500" />
                    </div>
                    <Drawer.Title className="text-3xl font-black text-zinc-900 dark:text-white mb-2 leading-tight">
                      Nova Lista
                    </Drawer.Title>
                    <Drawer.Description className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">
                      Organize suas compras com amigos e família.
                    </Drawer.Description>
                  </div>
                  <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => (isRecording ? stopRecording() : startRecording())}
                        disabled={isAiProcessing}
                        className={`p-6 w-full rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 transition-all border active:scale-95 relative overflow-hidden min-h-[140px] shadow-sm ${isRecording ? "bg-red-500 text-white border-red-600 animate-pulse" : "bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 border-zinc-100 dark:border-white/5 hover:bg-white dark:hover:bg-zinc-900 shadow-inner"}`}
                      >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isRecording ? 'bg-white/20' : 'bg-indigo-500/10 dark:bg-indigo-500/20'}`}>
                          {isAiProcessing ? (
                            <Loader2 className="w-6 h-6 animate-spin" />
                          ) : isRecording ? (
                            <Square className="w-5 h-5 fill-current text-white" />
                          ) : (
                            <Mic className="w-6 h-6 text-indigo-500" />
                          )}
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-black">{isAiProcessing ? "Processando..." : isRecording ? "Parar" : "Via Áudio"}</span>
                          {!isAiProcessing && !isRecording && (
                            <span className="text-[8px] opacity-40 font-bold">Consome 1 grão</span>
                          )}
                        </div>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          trigger("medium")
                          setIsOcrScannerOpen(true)
                        }}
                        disabled={isAiProcessing}
                        className="p-6 w-full bg-zinc-50 dark:bg-zinc-900/50 text-zinc-600 dark:text-zinc-400 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center justify-center gap-3 hover:bg-white dark:hover:bg-zinc-900 transition-all border border-zinc-100 dark:border-white/5 active:scale-95 min-h-[140px] shadow-sm shadow-inner"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center">
                          <Camera className="w-6 h-6 text-indigo-500" />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[11px] font-black">Via Foto</span>
                          <span className="text-[8px] opacity-40 font-bold">Consome 2 grãos</span>
                        </div>
                      </button>
                    </div>

                    <form onSubmit={submitCreateList} className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                          Ou crie manualmente
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Digite o nome da lista..."
                            required
                            value={newListTitle}
                            onChange={(e) => setNewListTitle(e.target.value)}
                            className={`w-full bg-zinc-100 dark:bg-zinc-900 border-2 rounded-2xl py-5 px-6 text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-700 focus:outline-none transition-all shadow-inner font-bold text-base ${
                              !newListTitle.trim() && newListTitle.length > 0 
                                ? "border-red-500" 
                                : "border-transparent focus:border-indigo-500"
                            }`}
                          />
                          {!newListTitle.trim() && (newListTitle?.length || 0) > 0 && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black uppercase text-red-500 animate-pulse">
                              Obrigatório
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={createListPending || !newListTitle.trim() || isAiProcessing}
                        title={!newListTitle.trim() ? "Digite o nome da lista para continuar" : ""}
                        className="w-full py-5 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                      >
                        {createListPending || isAiProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-4 h-4" />
                            Criar Lista Manual
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="mb-6 text-center">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                      Confirmar Lista
                    </h2>
                    <p className="text-zinc-500 text-sm font-medium">
                      Confira o que a IA entendeu:
                    </p>
                  </div>
                  
                  <div className="space-y-4 mb-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 dark:text-zinc-500 ml-1">
                        Texto Transcrito (Edite se necessário)
                      </label>
                      <div className="relative">
                        <textarea
                          value={voiceTranscription}
                          onChange={(e) => setVoiceTranscription(e.target.value)}
                          className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-5 text-sm font-bold text-zinc-700 dark:text-zinc-300 min-h-[100px] resize-none outline-none transition-all shadow-inner"
                        />
                        <button
                          onClick={reprocessVoiceTranscription}
                          disabled={isAiProcessing}
                          className="absolute right-3 bottom-3 p-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors shadow-lg active:scale-95 disabled:opacity-50"
                          title="Reprocessar itens com este texto"
                        >
                          {isAiProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RotateCcw className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {voiceHint && (
                      <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex gap-3 animate-in slide-in-from-top-2">
                        <Loader2 className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-xs font-bold text-amber-600 dark:text-amber-400 leading-relaxed italic">
                          Dica da IA: &quot;{voiceHint}&quot;
                        </p>
                      </div>
                    )}

                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-[2.5rem] p-6 max-h-64 overflow-y-auto border border-zinc-100 dark:border-white/5 shadow-inner">
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400 mb-4">
                        Itens Identificados ({voiceItems.length})
                      </p>
                      {voiceItems.length > 0 ? (
                        <ul className="space-y-3">
                          {voiceItems.map((item, i) => (
                            <li
                              key={i}
                              className="flex items-center gap-3 text-sm font-bold text-zinc-700 dark:text-zinc-300 bg-white dark:bg-zinc-800/50 p-3 rounded-xl border border-zinc-100 dark:border-white/5"
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
                      ) : (
                        <div className="py-8 flex flex-col items-center justify-center text-center opacity-40">
                          <ShoppingBag className="w-8 h-8 mb-2" />
                          <p className="text-xs font-bold">Nenhum item claro</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3">
                    <button
                      onClick={confirmVoiceList}
                      disabled={isAiProcessing || voiceItems.length === 0}
                      className="w-full py-5 bg-indigo-500 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-50"
                    >
                      {isAiProcessing ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          <Check className="w-5 h-5" /> Criar Lista
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setShowVoicePreview(false)}
                      className="w-full py-4 text-zinc-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all"
                    >
                      <RotateCcw className="w-4 h-4" /> Gravar Novamente
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
