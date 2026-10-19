"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import type { LiveServerMessage, Session } from "@google/genai"
import { LiveAudio } from "@/lib/agent/live-audio"
import { aiCreditModal } from "@/hooks/use-ai-credit-modal"
import { LISTS_QUERY_KEY } from "@/hooks/use-lists"
import { ITEMS_QUERY_KEY } from "@/hooks/use-items"
import { PROFILE_QUERY_KEY } from "@/hooks/use-user"

export type LiveStatus = "idle" | "connecting" | "listening" | "speaking" | "working"

type Turn = { role: "user" | "assistant"; content: string }

/** O microfone aberto é cobrado mesmo em silêncio, então sessões ociosas são encerradas. */
const IDLE_TIMEOUT_MS = 60_000

interface UseLiveAgentOptions {
  listId: string | null
  /** Fala transcrita e finalizada, para entrar no histórico do chat. */
  onTurn: (turn: Turn) => void
  /** Sessão encerrada; `error` vem preenchido quando não foi o usuário que encerrou. */
  onEnd: (error?: string) => void
}

/**
 * Conversa por voz em tempo real com a Gaga (Gemini Live).
 *
 * PORQUÊ: O áudio vai direto do navegador ao Gemini por WebSocket (baixa latência,
 * permite interromper), autenticado por um token efêmero criado em /api/ai/agent/live.
 * As tools pedidas pelo modelo rodam em /api/ai/agent/tools, com a sessão do usuário.
 */
export function useLiveAgent({ listId, onTurn, onEnd }: UseLiveAgentOptions) {
  const [status, setStatus] = useState<LiveStatus>("idle")
  const [userText, setUserText] = useState("")
  const [assistantText, setAssistantText] = useState("")
  const [level, setLevel] = useState(0)
  const [elapsed, setElapsed] = useState(0)
  const queryClient = useQueryClient()

  const sessionRef = useRef<Session | null>(null)
  const audioRef = useRef<LiveAudio | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const turnRef = useRef({ user: "", assistant: "" })
  const activeRef = useRef(false)
  // Última vez que alguém falou ou a Gaga agiu, para encerrar sessões esquecidas abertas
  const lastActivityRef = useRef(0)
  const callbacksRef = useRef({ onTurn, onEnd })
  callbacksRef.current = { onTurn, onEnd }

  const flushTurn = useCallback((role: "user" | "assistant") => {
    const text = turnRef.current[role].trim()
    if (text) callbacksRef.current.onTurn({ role, content: text })
    turnRef.current[role] = ""
    if (role === "user") setUserText("")
    else setAssistantText("")
  }, [])

  const stop = useCallback(
    (error?: string) => {
      if (!activeRef.current) return
      activeRef.current = false
      flushTurn("user")
      flushTurn("assistant")
      if (timerRef.current) clearInterval(timerRef.current)
      timerRef.current = null
      sessionRef.current?.close()
      sessionRef.current = null
      audioRef.current?.close()
      audioRef.current = null
      setStatus("idle")
      setLevel(0)
      queryClient.invalidateQueries({ queryKey: PROFILE_QUERY_KEY })
      callbacksRef.current.onEnd(error)
    },
    [flushTurn, queryClient]
  )

  const runTools = useCallback(
    async (message: LiveServerMessage) => {
      const calls = message.toolCall?.functionCalls || []
      setStatus("working")
      flushTurn("user")
      const functionResponses = await Promise.all(
        calls.map(async (fc) => {
          try {
            const res = await fetch("/api/ai/agent/tools", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: fc.name, args: fc.args || {} })
            })
            const data = await res.json()
            if (data.listsChanged) queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY })
            ;(data.changedListIds as string[] | undefined)?.forEach((id) =>
              queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY(id) })
            )
            return { id: fc.id, name: fc.name, response: { result: res.ok ? data.result : { error: data.error } } }
          } catch {
            return { id: fc.id, name: fc.name, response: { result: { error: "Falha de conexão ao executar a ação." } } }
          }
        })
      )
      sessionRef.current?.sendToolResponse({ functionResponses })
    },
    [flushTurn, queryClient]
  )

  const handleMessage = useCallback(
    (message: LiveServerMessage) => {
      lastActivityRef.current = Date.now()
      if (message.toolCall) {
        void runTools(message)
        return
      }
      if (message.goAway) {
        stop("A sessão de voz atingiu o limite de tempo. Toque no microfone para continuar.")
        return
      }

      const content = message.serverContent
      if (!content) return
      const audio = audioRef.current

      if (content.inputTranscription?.text) {
        turnRef.current.user += content.inputTranscription.text
        setUserText(turnRef.current.user)
      }
      if (content.outputTranscription?.text) {
        if (turnRef.current.user) flushTurn("user")
        turnRef.current.assistant += content.outputTranscription.text
        setAssistantText(turnRef.current.assistant)
      }
      for (const part of content.modelTurn?.parts || []) {
        if (part.inlineData?.data && audio) {
          audio.play(part.inlineData.data)
          setStatus("speaking")
        }
      }
      if (content.interrupted) {
        audio?.interrupt()
        flushTurn("assistant")
        setStatus("listening")
      }
      if (content.turnComplete) {
        flushTurn("assistant")
        if (!audio?.isPlaying) setStatus("listening")
      }
    },
    [flushTurn, runTools, stop]
  )

  /** Deve ser chamado direto no toque do usuário (o iOS exige para liberar o áudio). */
  const start = useCallback(
    async (history: Turn[] = []) => {
      if (activeRef.current) return
      activeRef.current = true
      const audio = new LiveAudio()
      audioRef.current = audio
      audio.onPlaybackEnd = () => {
        if (activeRef.current) setStatus((s) => (s === "speaking" ? "listening" : s))
      }
      setStatus("connecting")
      setElapsed(0)

      try {
        const res = await fetch("/api/ai/agent/live", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ listId })
        })
        const data = await res.json().catch(() => ({}))
        if (res.status === 403) aiCreditModal.open()
        if (!res.ok) throw new Error(data.error || "Não consegui iniciar a conversa por voz.")
        if (!activeRef.current) return

        // SDK carregado sob demanda: só quem usa a voz baixa o pacote
        const { GoogleGenAI, Modality } = await import("@google/genai")
        if (!activeRef.current) return
        const ai = new GoogleGenAI({ apiKey: data.token, httpOptions: { apiVersion: "v1alpha" } })
        const session = await ai.live.connect({
          model: data.model,
          config: { responseModalities: [Modality.AUDIO] },
          callbacks: {
            onmessage: handleMessage,
            onerror: () => stop("A conexão de voz caiu. Você pode continuar por texto."),
            onclose: (e) => {
              if (activeRef.current) stop(e.reason ? `A conversa por voz foi encerrada (${e.reason}).` : undefined)
            }
          }
        })
        if (!activeRef.current) {
          session.close()
          return
        }
        sessionRef.current = session

        // Continua de onde o chat de texto parou
        const recent = history.slice(-10)
        if (recent.length) {
          session.sendClientContent({
            turns: recent.map((t) => ({ role: t.role === "user" ? "user" : "model", parts: [{ text: t.content }] })),
            turnComplete: false
          })
        }

        await audio.startMic((chunk, micLevel) => {
          sessionRef.current?.sendRealtimeInput({ audio: { data: chunk, mimeType: "audio/pcm;rate=16000" } })
          setLevel(micLevel)
        })
        setStatus("listening")

        // Cobra cada minuto adicional e respeita o limite da sessão
        let seconds = 0
        lastActivityRef.current = Date.now()
        timerRef.current = setInterval(async () => {
          seconds++
          setElapsed(seconds)
          if (Date.now() - lastActivityRef.current > IDLE_TIMEOUT_MS && !audioRef.current?.isPlaying) {
            stop("Encerrei a conversa por voz porque ficou um tempo em silêncio.")
          } else if (seconds >= data.maxMinutes * 60) {
            stop(`A conversa por voz tem limite de ${data.maxMinutes} minutos. Toque no microfone para continuar.`)
          } else if (seconds % 60 === 0) {
            const tick = await fetch("/api/ai/agent/live/minute", { method: "POST" }).catch(() => null)
            if (tick?.status === 403) {
              aiCreditModal.open()
              stop("Seus grãos acabaram. Encerrei a conversa por voz.")
            }
          }
        }, 1000)
      } catch (err: any) {
        const denied = err?.name === "NotAllowedError"
        stop(denied ? "Preciso de acesso ao microfone para conversar por voz." : err?.message || "A conversa por voz está indisponível agora.")
      }
    },
    [listId, handleMessage, stop]
  )

  useEffect(() => () => stop(), [stop])

  return { status, userText, assistantText, level, elapsed, start, stop: () => stop(), isActive: status !== "idle" }
}
