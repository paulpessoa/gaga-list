'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useHaptic } from './use-haptic';

export interface PresenceUser {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  phone?: string | null; // Adicionado para suportar WhatsApp
  lat: number | null;
  lng: number | null;
  last_seen: string;
  distance?: number; // em metros
  bearing?: number | null; // em graus (0-360)
}

export function usePresence(listId: string, currentUser: any) {
  const [onlineUsers, setOnlineUsers] = useState<Record<string, PresenceUser>>({});
  const [myLocation, setMyLocation] = useState<{ lat: number, lng: number } | null>(null);
  const [lastNudge, setLastNudge] = useState<{ senderName: string, time: number } | null>(null);
  const supabase = createClient();
  const { trigger } = useHaptic();
  const channelRef = useRef<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;
    
    // Buscar perfil completo para carregar telefone e permissões
    supabase
      .from('profiles')
      .select('allow_notifications, full_name, avatar_url, phone')
      .eq('id', currentUser.id)
      .maybeSingle()
      .then(({ data }) => setUserProfile(data));
  }, [currentUser, supabase]);

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
      const { targetId, senderName } = payload.payload;
      
      if (targetId === currentUser.id) {
        if (userProfile?.allow_notifications !== false) {
          if ('vibrate' in navigator) {
            navigator.vibrate([200, 100, 200]);
          }
          trigger('heavy');
          setLastNudge({ senderName, time: Date.now() });
          setTimeout(() => setLastNudge(null), 5000);
        }
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
            phone: userState.phone, // Recebendo o telefone em tempo real
            lat: userState.lat,
            lng: userState.lng,
            last_seen: new Date().toISOString(),
          };
        });
        setOnlineUsers(formatted);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Track inicial com dados do perfil (incluindo telefone)
          await channel.track({
            full_name: userProfile?.full_name || currentUser.user_metadata?.full_name || 'Usuário',
            avatar_url: userProfile?.avatar_url || currentUser.user_metadata?.avatar_url || null,
            phone: userProfile?.phone || null,
            lat: null,
            lng: null,
            online_at: new Date().toISOString(),
          });
        }
      });

    // 4. Rastrear Localização GPS
    let watchId: number;
    if ('geolocation' in navigator) {
      watchId = navigator.geolocation.watchPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setMyLocation(coords);
          
          channel.track({
            full_name: userProfile?.full_name || currentUser.user_metadata?.full_name || 'Usuário',
            avatar_url: userProfile?.avatar_url || currentUser.user_metadata?.avatar_url || null,
            phone: userProfile?.phone || null,
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
  }, [listId, currentUser, supabase, trigger, userProfile]);

  const sendNudge = (targetId: string) => {
    if (channelRef.current) {
      const payload = {
        targetId,
        senderName: userProfile?.full_name || currentUser.user_metadata?.full_name || 'Alguém',
      };

      channelRef.current.send({
        type: 'broadcast',
        event: 'nudge',
        payload,
      });

      const targetInbox = supabase.channel(`user_inbox_${targetId}`);
      targetInbox.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await targetInbox.send({
            type: 'broadcast',
            event: 'nudge',
            payload,
          });
          supabase.removeChannel(targetInbox);
        }
      });

      trigger('light');
    }
  };

  return { onlineUsers, myLocation, sendNudge, lastNudge };
}
