"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import {
  Send,
  Loader2,
  MessageSquare,
  X,
  User
} from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"
import Image from "next/image"

interface Message {
  id: string
  content: string
  user_id: string
  created_at: string
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    email: string
  }
}

interface ListChatProps {
  listId: string
  listTitle?: string
  collaborators?: any[]
  currentUser: any
  isOpen: boolean
  onClose: () => void
}

export function ListChat({
  listId,
  listTitle,
  collaborators,
  currentUser,
  isOpen,
  onClose
}: ListChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const supabase = createClient()
  const { trigger } = useHaptic()
  const scrollRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }, [])

  useEffect(() => {
    if (!isOpen || !listId) return

    const channel = supabase.channel(`list_chat_${listId}`)

    channelRef.current = channel

    const fetchHistory = async () => {
      setIsLoading(true)
      const { data, error } = await (supabase.from("list_messages") as any)
        .select(
          `
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            email
          )
        `
        )
        .eq("list_id", listId)
        .order("created_at", { ascending: true })
        .limit(50)

      if (!error && data) {
        setMessages(data as any)
      } else {
        setMessages([])
      }
      setIsLoading(false)
      scrollToBottom()
    }

    fetchHistory()

    channel.on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "public",
        table: "list_messages",
        filter: `list_id=eq.${listId}`
      },
      async (payload) => {
        const { data: profileData } = await (supabase.from("profiles") as any)
          .select("*")
          .eq("id", payload.new.user_id)
          .single()

        const fullMessage: Message = {
          ...(payload.new as Message),
          profiles: profileData || undefined
        }

        setMessages((prev) => [...prev, fullMessage])
        scrollToBottom()
        if (payload.new.user_id !== currentUser?.id) trigger("light")
      }
    )

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    listId,
    isOpen,
    currentUser?.id,
    supabase,
    trigger,
    scrollToBottom
  ])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser || isSending) return

    setIsSending(true)
    const content = newMessage.trim()
    setNewMessage("")
    trigger("medium")

    const { error } = await (supabase.from("list_messages") as any).insert({
      list_id: listId,
      user_id: currentUser.id,
      content: content
    })

    if (error) {
      console.error("Erro ao enviar mensagem:", error)
      setNewMessage(content)
    } else {
      // Broadcast para os outros colaboradores
      const others = (collaborators || []).filter(c => c.user_id !== currentUser.id)
      
      others.forEach(collab => {
        const targetId = collab.user_id
        const inbox = supabase.channel(`user_inbox_${targetId}`)
        inbox.subscribe(async (status) => {
          if (status === "SUBSCRIBED") {
            await inbox.send({
              type: "broadcast",
              event: "dm",
              payload: {
                content,
                profiles: { 
                  full_name: currentUser.user_metadata?.full_name || "Alguém",
                  avatar_url: currentUser.user_metadata?.avatar_url
                },
                user_id: currentUser.id,
                listId,
                listTitle: listTitle || "Lista"
              }
            })
            supabase.removeChannel(inbox)
          }
        })
      })
    }
    setIsSending(false)
    scrollToBottom()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[2000] flex items-end justify-center sm:items-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#131313] w-full h-[90vh] sm:h-[650px] sm:max-w-lg sm:rounded-[2.5rem] flex flex-col relative shadow-2xl border-none sm:border sm:border-[#3d4a3d]/60 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        <header className="p-6 px-8 border-b border-[#3d4a3d]/60 flex items-center justify-between sm:rounded-t-[2.5rem]">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center bg-indigo-500/20 text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-black text-white leading-tight">
                Chat: {listTitle || "em Grupo"}
              </h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[9px] text-zinc-500 uppercase tracking-[0.15em] font-black">
                  Nuvem Ativa
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_5px_rgba(99,102,241,0.5)]" />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-3 rounded-2xl bg-[#1c1b1b] text-zinc-500 hover:text-white transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-6 scrollbar-hide bg-[#0e0e0e]"
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 text-zinc-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Sincronizando...
              </span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-4 opacity-30">
              <div className="w-20 h-20 rounded-[2rem] bg-[#1c1b1b] flex items-center justify-center">
                <MessageSquare className="w-8 h-8 text-zinc-500" />
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest max-w-[200px]">
                Silêncio por aqui... Diga algo!
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.user_id === currentUser?.id
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"} animate-in fade-in slide-in-from-bottom-2 duration-300`}
                >
                  <div className={`flex gap-3 max-w-[85%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMine && (
                      <div className="w-9 h-9 rounded-2xl bg-zinc-900 flex-shrink-0 flex items-center justify-center overflow-hidden border-2 border-zinc-950 relative shadow-sm">
                        {msg.profiles?.avatar_url ? (
                          <Image
                            src={msg.profiles.avatar_url}
                            fill
                            className="object-cover"
                            alt="Avatar"
                            sizes="36px"
                          />
                        ) : (
                          <User className="w-5 h-5 text-zinc-500" />
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-1.5">
                      {!isMine && (
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest ml-1">
                          {msg.profiles?.full_name?.split(" ")[0] || "Usuário"}
                        </span>
                      )}
                      <div
                        className={`py-3.5 px-5 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${isMine ? "bg-indigo-500 text-white rounded-tr-none" : "bg-zinc-900 text-zinc-200 rounded-tl-none border border-[#3d4a3d]/60"}`}
                      >
                        {msg.content}
                      </div>
                      <span
                        className={`text-[8px] font-black text-zinc-600 uppercase tracking-tighter ${isMine ? "text-right mr-1" : "ml-1"}`}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        <footer className="p-6 px-8 bg-[#131313] border-t border-[#3d4a3d]/60 sm:rounded-b-[2.5rem]">
          <form onSubmit={handleSendMessage} className="flex gap-3">
            <input
              type="text"
              placeholder="Escreva uma mensagem para o grupo..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-[#1c1b1b] border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-zinc-700 focus:outline-none transition-all shadow-inner"
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || isSending}
              className="w-14 h-14 rounded-2xl flex items-center justify-center transition-all active:scale-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl bg-indigo-500 hover:bg-indigo-600 shadow-indigo-500/20"
            >
              {isSending ? (
                <Loader2 className="w-6 h-6 animate-spin text-white" />
              ) : (
                <Send className="w-6 h-6 text-white" />
              )}
            </button>
          </form>
        </footer>
      </div>
    </div>
  )
}

