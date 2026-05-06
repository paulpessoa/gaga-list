"use client"

import { useEffect, useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { useHaptic } from "./use-haptic"

export interface PresenceUser {
  user_id: string
  full_name: string
  avatar_url: string | null
  phone?: string | null
  lat: number | null
  lng: number | null
  last_seen: string
  distance?: number // em metros
  bearing?: number | null // em graus (0-360)
}

export function usePresence(listId: string, currentUser: any, listTitle?: string) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>(
    {}
  )
  const [myLocation, setMyLocation] = useState<{
    lat: number
    lng: number
  } | null>(null)
  const [lastNudge, setLastNudge] = useState<{
    senderName: string
    time: number
  } | null>(null)
  const supabase = createClient()
  const { trigger } = useHaptic()
  const channelRef = useRef<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)

  useEffect(() => {
    if (!currentUser) return
    supabase
      .from("profiles")
      .select(
        "allow_notifications, push_subscription, full_name, avatar_url, phone"
      )
      .eq("id", currentUser.id)
      .maybeSingle()
      .then(({ data }) => setUserProfile(data))
  }, [currentUser, supabase])

  // 1. Estabilizar a referência do Canal
  useEffect(() => {
    if (!listId || !currentUser) return

    const channel = supabase.channel(`list_presence_${listId}`, {
      config: {
        presence: {
          key: currentUser.id
        }
      }
    })

    channelRef.current = channel

    channel.on("broadcast", { event: "nudge" }, (payload) => {
      const { targetId, senderName } = payload.payload
      if (targetId === currentUser.id) {
        if (userProfile?.allow_notifications !== false) {
          if ("vibrate" in navigator) navigator.vibrate([200, 100, 200])
          trigger("heavy")
          setLastNudge({ senderName, time: Date.now() })
          setTimeout(() => setLastNudge(null), 5000)
        }
      }
    })

    channel.on("presence", { event: "sync" }, () => {
      const state = channel.presenceState()
      const formatted: Record<string, PresenceUser> = {}

      Object.keys(state).forEach((key) => {
        const sessions = state[key] as any[]
        if (!sessions?.length) return

        const bestSession = sessions.reduce((prev, curr) => {
          if (curr.lat && !prev.lat) return curr
          if (curr.online_at > prev.online_at) return curr
          return prev
        }, sessions[0])

        formatted[key] = {
          user_id: key,
          full_name: bestSession.full_name || "Usuário",
          avatar_url: bestSession.avatar_url,
          phone: bestSession.phone,
          lat: bestSession.lat,
          lng: bestSession.lng,
          last_seen: bestSession.online_at || new Date().toISOString()
        }
      })
      setOnlineUsers(formatted)
    })

    channel.subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [listId, currentUser?.id, supabase]) // Apenas listId e ID do usuário

  // 2. Sincronizar dados de Tracking (Perfil e Localização) sem re-conectar
  useEffect(() => {
    const channel = channelRef.current
    if (!channel || channel.state !== 'joined') return

    const trackData = {
      full_name: userProfile?.full_name || currentUser?.user_metadata?.full_name || "Usuário",
      avatar_url: userProfile?.avatar_url || currentUser?.user_metadata?.avatar_url || null,
      phone: userProfile?.phone || null,
      lat: myLocation?.lat || null,
      lng: myLocation?.lng || null,
      online_at: new Date().toISOString()
    }

    channel.track(trackData)
  }, [userProfile, myLocation, currentUser])

  // 3. Monitorar Geolocalização separadamente
  useEffect(() => {
    let watchId: number
    if ("geolocation" in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          setMyLocation({ 
            lat: pos.coords.latitude, 
            lng: pos.coords.longitude 
          })
        },
        (err) => console.error("Erro GPS:", err),
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    }
    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId)
    }
  }, [])

  const sendNudge = async (targetId: string) => {
    if (channelRef.current) {
      const senderName =
        userProfile?.full_name ||
        currentUser.user_metadata?.full_name ||
        "Alguém"

      // 1. Sinal Imediato (Realtime - App Aberto)
      channelRef.current.send({
        type: "broadcast",
        event: "nudge",
        payload: { targetId, senderName }
      })

      // 2. Sinal em Background (Push Notification - App Fechado)
      try {
        fetch("/api/push/nudge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: targetId, senderName, listId })
        })
      } catch (err) {
        console.error("Erro ao disparar push nudge:", err)
      }

      // 3. Inbox Pessoal
      const targetInbox = supabase.channel(`user_inbox_${targetId}`)
      targetInbox.subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await targetInbox.send({
            type: "broadcast",
            event: "nudge",
            payload: { 
              targetId, 
              senderName,
              listId,
              listTitle: listTitle || "uma lista"
            }
          })
          supabase.removeChannel(targetInbox)
        }
      })

      trigger("light")
    }
  }

  return { onlineUsers, myLocation, sendNudge, lastNudge }
}
