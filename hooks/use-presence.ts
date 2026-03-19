'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useHaptic } from './use-haptic';

export interface PresenceUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  lat: number | null;
  lng: number | null;
  last_seen: string;
  distance?: number; // em metros
}

export function usePresence(listId: string, currentUser: any) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({});
  const [myLocation, setMyLocation] = useState<{ lat: number, lng: number } | null>(null);
  const supabase = createClient();
  const { trigger } = useHaptic();
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!listId || !currentUser) return;

    // 1. Configurar Canal de Realtime
    const channel = supabase.channel(`list_presence_${listId}`, {
      config: {
        presence: {
          key: currentUser.id,
        },
      },
    });

    channelRef.current = channel;

    // 2. Escutar Broadcast de Vibração (O Sino!)
    channel.on('broadcast', { event: 'nudge' }, (payload) => {
      if (payload.payload.targetId === currentUser.id) {
        // Alguém clicou no seu sino!
        if ('vibrate' in navigator) {
          navigator.vibrate([200, 100, 200]);
        }
        trigger('heavy');
        alert(`🔔 ${payload.payload.senderName} está te chamando!`);
      }
    });

    // 3. Gerenciar Presença
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        const formatted: Record<string, PresenceUser> = {};
        
        Object.keys(state).forEach((key) => {
          const userState = state[key][0] as any;
          formatted[key] = {
            user_id: key,
            full_name: userState.full_name,
            avatar_url: userState.avatar_url,
            lat: userState.lat,
            lng: userState.lng,
            last_seen: new Date().toISOString(),
          };
        });
        setOnlineUsers(formatted);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log('User joined:', key, newPresences);
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        setOnlineUsers((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track inicial
          await channel.track({
            full_name: currentUser.user_metadata?.full_name || 'Usuário',
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            lat: null,
            lng: null,
            online_at: new Date().toISOString(),
          });
        }
      });

    // 4. Rastrear Localização GPS (se permitido)
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(coords);
          
          // Enviar posição para o Presence
          channel.track({
            full_name: currentUser.user_metadata?.full_name || 'Usuário',
            avatar_url: currentUser.user_metadata?.avatar_url || null,
            lat: coords.lat,
            lng: coords.lng,
            online_at: new Date().toISOString(),
          });
        },
        (err) => console.error('Erro GPS:', err),
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    }

    return () => {
      supabase.removeChannel(channel);
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [listId, currentUser, supabase, trigger]);

  // Função para dar o "Sino" (Vibrar o outro)
  const sendNudge = (targetId: string) => {
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'nudge',
        payload: {
          targetId,
          senderName: currentUser.user_metadata?.full_name || 'Alguém',
        },
      });
      trigger('light');
    }
  };

  return { onlineUsers, myLocation, sendNudge };
}
