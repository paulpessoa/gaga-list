"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { Send, Loader2, MessageSquare, X, User } from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"

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
  currentUser: any
  isOpen: boolean
  onClose: () => void
}

export function ListChat({ listId, currentUser, isOpen, onClose }: ListChatProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [isSending, setIsSending] = useState(false)
  const supabase = createClient()
  const { trigger } = useHaptic()
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen || !listId) return

    // 1. Carregar mensagens iniciais
    const fetchMessages = async () => {
      setIsLoading(true)
      const { data, error } = await supabase
        .from("list_messages")
        .select(`
          *,
          profiles:user_id (
            full_name,
            avatar_url,
            email
          )
        `)
        .eq("list_id", listId)
        .order("created_at", { ascending: true })
        .limit(50)

      if (!error && data) {
        setMessages(data as any)
      }
      setIsLoading(false)
      scrollToBottom()
    }

    fetchMessages()

    // 2. Escutar novas mensagens via Realtime
    const channel = supabase
      .channel(`list_chat_${listId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "list_messages",
          filter: `list_id=eq.${listId}`,
        },
        async (payload) => {
          // Quando uma nova mensagem chega, buscamos o perfil do autor
          const { data: profileData } = await supabase
            .from("profiles")
            .select("full_name, avatar_url, email")
            .eq("id", payload.new.user_id)
            .single()

          const fullMessage: Message = {
            ...(payload.new as Message),
            profiles: profileData || undefined,
          }

          setMessages((prev) => [...prev, fullMessage])
          scrollToBottom()
          
          if (payload.new.user_id !== currentUser?.id) {
            trigger("light")
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, isOpen, supabase, currentUser?.id, trigger])

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight
      }
    }, 100)
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim() || !currentUser || isSending) return

    setIsSending(true)
    const content = newMessage.trim()
    setNewMessage("")
    trigger("medium")

    const { error } = await supabase.from("list_messages").insert({
      list_id: listId,
      user_id: currentUser.id,
      content: content,
    })

    if (error) {
      console.error("Erro ao enviar mensagem:", error)
      setNewMessage(content) // Devolve o texto em caso de erro
    }
    
    setIsSending(false)
    scrollToBottom()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="glass-panel w-full max-w-lg h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl flex flex-col relative shadow-2xl border border-white/10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
        {/* Header */}
        <header className="p-6 border-b border-white/5 flex items-center justify-between bg-zinc-900/50 rounded-t-3xl">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Chat da Lista</h2>
              <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Tempo Real</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </header>

        {/* Messages List */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scrollbar-hide"
        >
          {isLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-2 text-zinc-500">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
              <span className="text-sm">Carregando histórico...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center gap-3 opacity-40">
              <MessageSquare className="w-12 h-12 text-zinc-600" />
              <p className="text-sm text-zinc-500 max-w-[200px]">Nenhuma mensagem ainda. Comece a conversar!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMine = msg.user_id === currentUser?.id
              return (
                <div 
                  key={msg.id} 
                  className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${isMine ? "flex-row-reverse" : "flex-row"}`}>
                    {!isMine && (
                      <div className="w-8 h-8 rounded-full bg-zinc-800 flex-shrink-0 flex items-center justify-center overflow-hidden border border-white/5">
                        {msg.profiles?.avatar_url ? (
                          <img src={msg.profiles.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <User className="w-4 h-4 text-zinc-600" />
                        )}
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      {!isMine && (
                        <span className="text-[10px] font-bold text-zinc-500 ml-1">
                          {msg.profiles?.full_name || msg.profiles?.email.split("@")[0]}
                        </span>
                      )}
                      <div 
                        className={`py-3 px-4 rounded-2xl text-sm ${
                          isMine 
                            ? "bg-indigo-600 text-white rounded-tr-none shadow-lg shadow-indigo-500/10" 
                            : "bg-zinc-800 text-zinc-200 rounded-tl-none border border-white/5"
                        }`}
                      >
                        {msg.content}
                      </div>
                      <span className={`text-[9px] text-zinc-600 ${isMine ? "text-right mr-1" : "ml-1"}`}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Input Area */}
        <footer className="p-4 bg-zinc-950/50 border-t border-white/5 sm:rounded-b-3xl">
          <form onSubmit={handleSendMessage} className="flex gap-2">
            <input 
              type="text" 
              placeholder="Escreva uma mensagem..." 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1 bg-zinc-900 border border-white/10 rounded-2xl py-3.5 px-5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
            />
            <button 
              type="submit" 
              disabled={!newMessage.trim() || isSending}
              className="w-12 h-12 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl flex items-center justify-center transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
            >
              {isSending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </footer>
      </div>
    </div>
  )
}
