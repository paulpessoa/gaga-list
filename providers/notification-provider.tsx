"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useUser } from "@/hooks/use-user"
import { useHaptic } from "@/hooks/use-haptic"

export interface Notification {
  id: string
  type: "dm" | "nudge" | "group"
  senderName: string
  message?: string
  time: number
  listId: string
  listTitle?: string
  senderId?: string
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

    const channel = supabase.channel(`user_inbox_${user.id}`)

    channel
      .on("broadcast", { event: "dm" }, (payload) => {
        const { content, profiles, user_id, listId, listTitle } = payload.payload
        
        if (user_id !== user.id) {
          trigger("heavy")
          setNotifications(prev => [{
            id: Math.random().toString(),
            type: "dm",
            senderName: profiles?.full_name || "Alguém",
            message: content,
            time: Date.now(),
            listId,
            listTitle,
            senderId: user_id
          }, ...prev])
          setUnreadCount(prev => prev + 1)
        }
      })
      .on("broadcast", { event: "nudge" }, (payload) => {
        const { senderName, targetId, listId, listTitle } = payload.payload
        
        if (targetId === user.id) {
          trigger("heavy")
          
          setNotifications(prev => [{
            id: Math.random().toString(),
            type: "nudge",
            senderName: senderName || "Alguém",
            time: Date.now(),
            listId,
            listTitle
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
