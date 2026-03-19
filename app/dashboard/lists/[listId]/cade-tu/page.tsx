'use client';

import { useUser } from '@/hooks/use-user';
import { usePresence, PresenceUser } from '@/hooks/use-presence';
import { useParams } from 'next/navigation';
import { ArrowLeft, MapPin, Bell, MessageSquare, Navigation, Map as MapIcon, Loader2, User } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useHaptic } from '@/hooks/use-haptic';
import { ListChat } from '@/components/lists/list-chat';

// Importação dinâmica do mapa para evitar erros de SSR
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const Circle = dynamic(() => import('react-leaflet').then(mod => mod.Circle), { ssr: false });
const useMap = dynamic(() => import('react-leaflet').then(mod => mod.useMap), { ssr: false });

// Componente para mudar a visão do mapa programaticamente
function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = (useMap as any)();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

// Função Haversine no Frontend para cálculo rápido de distância
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metros
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // metros
}

export default function CadeTuPage() {
  const { listId } = useParams() as { listId: string };
  const { data: user } = useUser();
  const { onlineUsers, myLocation, sendNudge, lastNudge } = usePresence(listId, user);
  const { trigger } = useHaptic();
  
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [L, setL] = useState<any>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ id: string, full_name: string | null, avatar_url: string | null } | undefined>(undefined);

  // Inicializar ícones do Leaflet no lado do cliente
  useEffect(() => {
    import('leaflet').then((leaflet) => {
      setL(leaflet);
    });
  }, []);

  // Definir centro inicial do mapa quando o GPS carregar
  useEffect(() => {
    if (myLocation && !mapCenter) {
      setMapCenter([myLocation.lat, myLocation.lng]);
    }
  }, [myLocation, mapCenter]);

  // Calcular distâncias em tempo real
  const usersWithDistance = useMemo(() => {
    if (!myLocation) return Object.values(onlineUsers);
    
    return Object.values(onlineUsers).map(u => {
      if (u.lat && u.lng) {
        return {
          ...u,
          distance: getDistance(myLocation.lat, myLocation.lng, u.lat, u.lng)
        };
      }
      return u;
    }).sort((a, b) => (a.distance || 999999) - (b.distance || 999999));
  }, [onlineUsers, myLocation]);

  const handleNudge = (targetId: string, name: string) => {
    sendNudge(targetId);
    trigger('medium');
  };

  const focusUser = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    trigger('light');
  };

  return (
    <main className="min-h-screen bg-black flex flex-col overflow-hidden">
      {/* Banner de Notificação (Nudge) */}
      {lastNudge && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-top-full duration-300">
          <div className="bg-indigo-600 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-indigo-400">
            <Bell className="w-5 h-5 animate-bounce" />
            <span className="font-bold text-sm">{lastNudge.senderName} está te chamando!</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="p-4 flex items-center gap-4 bg-zinc-950/80 backdrop-blur-md border-b border-white/5 z-20">
        <Link href={`/dashboard/lists/${listId}`} className="p-2 rounded-full hover:bg-zinc-800 text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight">Cadê tu?</h1>
          <p className="text-xs text-zinc-500">Localização em tempo real</p>
        </div>
      </header>

      {/* Mapa */}
      <div className="flex-1 relative bg-zinc-900 overflow-hidden">
        {!mapCenter ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 z-10 bg-zinc-950">
            <div className="w-16 h-16 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Navigation className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <p className="text-zinc-400 animate-pulse">Aguardando sinal GPS...</p>
          </div>
        ) : (
          <div className="h-full w-full">
            {/* O Leaflet só renderiza no cliente */}
            {typeof window !== 'undefined' && L && (
              <MapContainer 
                center={mapCenter} 
                zoom={18} 
                style={{ height: '100%', width: '100%' }}
                zoomControl={false}
              >
                <ChangeView center={mapCenter} zoom={18} />
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  className="map-tiles-dark" // CSS personalizado para deixar o mapa escuro
                />
                
                {/* Meu Ponto */}
                {myLocation && (
                  <>
                    <Circle center={[myLocation.lat, myLocation.lng]} radius={10} pathOptions={{ color: '#6366f1', fillOpacity: 0.1 }} />
                    <Marker position={[myLocation.lat, myLocation.lng]} icon={L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div class="w-8 h-8 rounded-full border-2 border-white bg-indigo-500 shadow-lg flex items-center justify-center overflow-hidden"><img src="${user?.user_metadata?.avatar_url || 'https://ui-avatars.com/api/?name=Eu'}" class="w-full h-full object-cover" /></div>`,
                      iconSize: [32, 32],
                      iconAnchor: [16, 16]
                    })}>
                      <Popup>Você está aqui</Popup>
                    </Marker>
                  </>
                )}

                {/* Amigos */}
                {usersWithDistance.map(u => u.user_id !== user?.id && u.lat && u.lng && (
                  <Marker key={u.user_id} position={[u.lat, u.lng]} icon={L.divIcon({
                    className: 'custom-div-icon',
                    html: `<div class="w-8 h-8 rounded-full border-2 border-emerald-500 bg-zinc-900 shadow-lg flex items-center justify-center overflow-hidden"><img src="${u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`}" class="w-full h-full object-cover" /></div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                  })}>
                    <Popup>{u.full_name}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}
          </div>
        )}

        {/* Radar Flutuante (Bottom Sheet Style) */}
        <div className="absolute bottom-6 left-6 right-6 z-20 space-y-3 pointer-events-none">
          {usersWithDistance.filter(u => u.user_id !== user?.id).map((u) => (
            <div 
              key={u.user_id} 
              className="glass-panel p-4 rounded-3xl border border-white/10 shadow-2xl flex items-center justify-between gap-4 pointer-events-auto animate-in slide-in-from-bottom-4"
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-zinc-800 bg-zinc-900">
                    <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}`} className="w-full h-full object-cover" />
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-zinc-950"></div>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white leading-tight">{u.full_name}</h3>
                  <p className="text-xs text-zinc-500 font-medium">
                    {u.distance ? (u.distance < 1000 ? `${Math.round(u.distance)}m` : `${(u.distance/1000).toFixed(1)}km`) : 'Calculando...'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => u.lat && u.lng && focusUser(u.lat, u.lng)}
                  className="p-3 rounded-2xl bg-zinc-800/50 text-zinc-400 hover:text-white transition-colors"
                >
                  <MapIcon className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => handleNudge(u.user_id, u.full_name)}
                  className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all active:scale-90"
                >
                  <Bell className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => {
                    trigger('light');
                    setChatTarget({
                      id: u.user_id,
                      full_name: u.full_name,
                      avatar_url: u.avatar_url
                    });
                    setIsChatOpen(true);
                  }}
                  className="p-3 rounded-2xl bg-zinc-800/50 text-zinc-400 hover:text-indigo-400 transition-colors"
                  title="Chat Individual"
                >
                  <MessageSquare className="w-5 h-5" />
                </button>
              </div>
            </div>
          ))}

          {usersWithDistance.length <= 1 && (
            <div className="glass-panel p-6 rounded-3xl border border-white/5 text-center pointer-events-auto">
              <p className="text-sm text-zinc-500 italic">Ninguém mais da lista está com o GPS ligado agora.</p>
            </div>
          )}
        </div>
      </div>

      <ListChat 
        listId={listId}
        currentUser={user}
        isOpen={isChatOpen}
        onClose={() => {
          setIsChatOpen(false);
          setChatTarget(undefined);
        }}
        targetUser={chatTarget}
      />

      <style jsx global>{`
        .map-tiles-dark {
          filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
        }
        .leaflet-container {
          background: #09090b !important;
        }
        .leaflet-bar {
          border: none !important;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5) !important;
        }
        .leaflet-popup-content-wrapper {
          background: #18181b !important;
          color: white !important;
          border-radius: 12px !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
        }
        .leaflet-popup-tip {
          background: #18181b !important;
        }
      `}</style>
    </main>
  );
}
