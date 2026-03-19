"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useHaptic } from "@/hooks/use-haptic"

interface Notification {
  id: string
  type: "dm" | "nudge"
  senderName: string
  message?: string
  time: number
}

interface NotificationContextType {
  unreadCount: number
  notifications: Notification[]
  clearNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    if (!user) return

    // Canal de Inbox Pessoal (Ouvinte Global)
    const channel = supabase.channel(`user_inbox_${user.id}`)

    channel
      .on("broadcast", { event: "dm" }, (payload) => {
        const { content, profiles, user_id } = payload.payload
        
        // Só notifica se a mensagem não for minha
        if (user_id !== user.id) {
          trigger("heavy")
          setNotifications(prev => [{
            id: Math.random().toString(),
            type: "dm",
            senderName: profiles?.full_name || "Alguém",
            message: content,
            time: Date.now()
          }, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      })
      .on("broadcast", { event: "nudge" }, (payload) => {
        const { senderName, targetId } = payload.payload
        
        // Só notifica se eu for o alvo
        if (targetId === user.id) {
          trigger("heavy")
          if ('vibrate' in navigator) navigator.vibrate([200, 100, 200])
          
          setNotifications(prev => [{
            id: Math.random().toString(),
            type: "nudge",
            senderName: senderName || "Alguém",
            time: Date.now()
          }, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, supabase, trigger])

  const clearNotifications = () => {
    setUnreadCount(0)
    setNotifications([])
  }

  return (
    <NotificationContext.Provider value={{ unreadCount, notifications, clearNotifications }}>
      {children}
    </NotificationContext.Provider>
  )
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotifications must be used within a NotificationProvider")
  return context
}
