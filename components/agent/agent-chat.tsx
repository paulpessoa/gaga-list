"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { motion, AnimatePresence } from "framer-motion"
import { Sparkles, Send, Loader2, X, RotateCcw, Mic, PhoneOff } from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"
import { useLiveAgent, type LiveStatus } from "@/hooks/use-live-agent"
import { useAICosts } from "@/hooks/use-ai-costs"
import { useAICreditCheck } from "@/hooks/use-ai-credit-check"
import { aiCreditModal } from "@/hooks/use-ai-credit-modal"
import { LISTS_QUERY_KEY } from "@/hooks/use-lists"
import { ITEMS_QUERY_KEY } from "@/hooks/use-items"
import { PROFILE_QUERY_KEY } from "@/hooks/use-user"

type ChatMessage = { role: "user" | "assistant"; content: string; isError?: boolean }

const SUGGESTIONS = [
  "O que está faltando na lista?",
  "Anota arroz, feijão e 2kg de carne",
  "Quanto vai dar a compra?",
  "Monta uma lista pra um churrasco"
]

const LIVE_STATUS_LABEL: Record<LiveStatus, string> = {
  idle: "",
  connecting: "Conectando...",
  listening: "Pode falar, estou ouvindo",
  speaking: "Gaga falando · fale para interromper",
  working: "Mexendo na sua lista..."
}

const formatElapsed = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`

interface AgentChatProps {
  /** Lista aberta na tela, usada como lista padrão pelo agente. */
  listId: string | null
}

/**
 * Chat com a assistente Gaga (agente conversacional com tools).
 * PORQUÊ: Fica montado no NavigationWrapper para a conversa sobreviver à navegação
 * entre telas, e invalida o cache do React Query quando o agente altera listas.
 */
export function AgentChat({ listId }: AgentChatProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState("")
  const [isSending, setIsSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  const queryClient = useQueryClient()
  const { trigger } = useHaptic()
  const { costs } = useAICosts()
  const { checkAndAct } = useAICreditCheck()

  const live = useLiveAgent({
    listId,
    onTurn: (turn) => setMessages((prev) => [...prev, turn]),
    onEnd: (error) => {
      if (error) setMessages((prev) => [...prev, { role: "assistant", content: error, isError: true }])
    }
  })

  const startLive = () => {
    trigger("medium")
    // Chamado de forma síncrona dentro do toque, para o iOS liberar o áudio
    checkAndAct(costs.cost_live_minute, () => {
      void live.start(messages.filter((m) => !m.isError))
    })
  }

  const closePanel = () => {
    live.stop()
    setIsOpen(false)
  }

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }, 50)
  }, [])

  useEffect(() => {
    if (isOpen) scrollToBottom()
  }, [isOpen, messages.length, scrollToBottom])

  const send = async (text: string) => {
    const content = text.trim()
    if (!content || isSending) return

    const history = [...messages.filter((m) => !m.isError), { role: "user" as const, content }]
    setMessages((prev) => [...prev, { role: "user", content }])
    setInput("")
    setIsSending(true)
    trigger("medium")

    try {
      const res = await fetch("/api/ai/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: history.map(({ role, content }) => ({ role, content })),
          listId
        })
      })
      const data = await res.json().catch(() => ({}))

      if (res.status === 403) aiCreditModal.open()
      if (!res.ok) throw new Error(data.error || "Não consegui responder agora.")

      setMessages((prev) => [...prev, { role: "assistant", content: data.reply }])
      trigger("light")

      if (data.listsChanged) queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY })
      ;(data.changedListIds as string[] | undefined)?.forEach((id) =>
        queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY(id) })
      )
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "assistant", content: err.message, isError: true }])
      trigger("heavy")
      // Uma falha no meio pode ter alterado algo antes do erro
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY })
      if (listId) queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY(listId) })
    } finally {
      setIsSending(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    checkAndAct(costs.cost_agent, () => send(input))
  }

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="agent-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            onClick={() => {
              trigger("medium")
              setIsOpen(true)
            }}
            className="fixed bottom-28 right-5 z-50 w-14 h-14 rounded-[1.5rem] flex items-center justify-center bg-[#1c1b1b] border border-[#53E076]/40 text-[#53E076] shadow-2xl neon-glow-sm active:scale-90 transition-transform"
            aria-label="Falar com a assistente Gaga"
          >
            <Sparkles className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#131313] w-full h-[90vh] sm:h-[650px] sm:max-w-lg sm:rounded-[2.5rem] rounded-t-[2.5rem] flex flex-col relative shadow-2xl border-t border-[#3d4a3d]/60 sm:border animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <header className="p-6 px-8 border-b border-[#3d4a3d]/60 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-[#53E076]/15 text-[#53E076]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-black text-white leading-tight">Gaga</h2>
                  <span className="text-[9px] text-zinc-500 uppercase tracking-[0.15em] font-black mt-0.5">
                    Assistente · {costs.cost_agent} {costs.cost_agent === 1 ? "grão" : "grãos"} por mensagem
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {messages.length > 0 && (
                  <button
                    onClick={() => setMessages([])}
                    disabled={isSending || live.isActive}
                    className="p-3 rounded-2xl bg-[#1c1b1b] text-zinc-500 hover:text-white transition-all disabled:opacity-40"
                    aria-label="Nova conversa"
                  >
                    <RotateCcw className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={closePanel}
                  className="p-3 rounded-2xl bg-[#1c1b1b] text-zinc-500 hover:text-white transition-all"
                  aria-label="Fechar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide bg-[#0e0e0e]">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center gap-6">
                  <div className="flex flex-col items-center gap-3 opacity-60">
                    <div className="w-16 h-16 rounded-[1.75rem] bg-[#1c1b1b] flex items-center justify-center">
                      <Sparkles className="w-7 h-7 text-[#53E076]" />
                    </div>
                    <p className="text-xs text-zinc-400 font-bold max-w-[240px]">
                      Me peça para anotar, riscar, mover ou somar itens das suas listas. Toque no microfone para conversar por voz.
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    {SUGGESTIONS.map((s) => (
                      <button
                        key={s}
                        onClick={() => checkAndAct(costs.cost_agent, () => send(s))}
                        disabled={live.isActive}
                        className="text-xs font-bold text-zinc-300 bg-[#1c1b1b] border border-[#3d4a3d]/60 rounded-full px-4 py-2 active:scale-95 transition-transform disabled:opacity-40"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                  >
                    <div
                      className={`max-w-[85%] py-3 px-5 rounded-[1.5rem] text-sm font-medium leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-[#1DB954] text-[#003914] rounded-tr-none"
                          : msg.isError
                            ? "bg-red-500/10 text-red-300 border border-red-500/30 rounded-tl-none"
                            : "bg-zinc-900 text-zinc-200 border border-[#3d4a3d]/60 rounded-tl-none"
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))
              )}
              {isSending && (
                <div className="flex justify-start">
                  <div className="py-3 px-5 rounded-[1.5rem] rounded-tl-none bg-zinc-900 border border-[#3d4a3d]/60">
                    <Loader2 className="w-4 h-4 animate-spin text-[#53E076]" />
                  </div>
                </div>
              )}
            </div>

            <footer className="p-6 px-6 bg-[#131313] border-t border-[#3d4a3d]/60 sm:rounded-b-[2.5rem]">
              {live.isActive ? (
                <div className="flex flex-col items-center gap-4">
                  <div className="w-full min-h-[3.5rem] text-center text-sm leading-relaxed">
                    {live.userText && <p className="text-zinc-400 italic">“{live.userText}”</p>}
                    {live.assistantText && <p className="text-zinc-200">{live.assistantText}</p>}
                    {!live.userText && !live.assistantText && (
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 pt-4">
                        {LIVE_STATUS_LABEL[live.status]}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="relative w-16 h-16 flex items-center justify-center">
                      <span
                        className="absolute inset-0 rounded-full bg-[#53E076]/25 transition-transform duration-100"
                        style={{ transform: `scale(${live.status === "listening" ? 1 + Math.min(live.level * 6, 0.6) : 1})` }}
                        aria-hidden
                      />
                      <span
                        className={`relative w-12 h-12 rounded-full flex items-center justify-center bg-[#1DB954] text-[#003914] ${
                          live.status === "speaking" || live.status === "connecting" || live.status === "working" ? "animate-pulse" : ""
                        }`}
                      >
                        {live.status === "connecting" || live.status === "working" ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : live.status === "speaking" ? (
                          <Sparkles className="w-5 h-5" />
                        ) : (
                          <Mic className="w-5 h-5" />
                        )}
                      </span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="text-[10px] font-black uppercase tracking-widest text-[#53E076]">
                        {LIVE_STATUS_LABEL[live.status]}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-500">
                        {formatElapsed(live.elapsed)} · {costs.cost_live_minute} {costs.cost_live_minute === 1 ? "grão" : "grãos"}/min
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        trigger("medium")
                        live.stop()
                      }}
                      className="w-14 h-14 rounded-2xl flex items-center justify-center bg-red-500 text-white shadow-xl active:scale-90 transition-transform"
                      aria-label="Encerrar conversa por voz"
                    >
                      <PhoneOff className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              ) : (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <button
                  type="button"
                  onClick={startLive}
                  disabled={isSending}
                  className="w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 bg-[#1c1b1b] border border-[#53E076]/40 text-[#53E076]"
                  aria-label="Conversar por voz"
                >
                  <Mic className="w-6 h-6" />
                </button>
                <input
                  type="text"
                  placeholder="Fale com a Gaga..."
                  value={input}
                  maxLength={2000}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 min-w-0 bg-[#1c1b1b] border-2 border-transparent focus:border-[#53E076] rounded-2xl py-4 px-6 text-sm text-white placeholder:text-zinc-700 focus:outline-none transition-all shadow-inner"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isSending}
                  className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl bg-[#1DB954] text-[#003914]"
                  aria-label="Enviar"
                >
                  {isSending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Send className="w-6 h-6" />}
                </button>
              </form>
              )}
            </footer>
          </div>
        </div>
      )}
    </>
  )
}
