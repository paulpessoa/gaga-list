'use client';

import { useUser } from '@/hooks/use-user';
import { usePresence } from '@/hooks/use-presence';
import { useParams } from 'next/navigation';
import { ArrowLeft, MessageSquare, Navigation, User, Map as MapIcon, ChevronUp, MessageCircleMore, Lock, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useHaptic } from '@/hooks/use-haptic';
import { ListChat } from '@/components/lists/list-chat';
import { formatPhoneForWhatsApp } from '@/lib/utils';
import Image from 'next/image';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getBearing(lat1: number, lon1: number, lat2: number, lon2: number) {
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const λ1 = (lon1 * Math.PI) / 180;
  const λ2 = (lon2 * Math.PI) / 180;
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}

export default function CadeTuPage() {
  const { listId } = useParams() as { listId: string };
  const { data: user } = useUser();
  const { onlineUsers, myLocation } = usePresence(listId, user);
  const { trigger } = useHaptic();
  
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatTarget, setChatTarget] = useState<{ id: string, full_name: string | null, avatar_url: string | null } | undefined>(undefined);
  const [L, setL] = useState<any>(null);
  const [gpsPermission, setGpsPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    import('leaflet').then((leaflet) => setL(leaflet));
    
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as any }).then((result) => {
        setGpsPermission(result.state as any);
        result.onchange = () => setGpsPermission(result.state as any);
      });
    }
  }, []);

  useEffect(() => {
    if (myLocation && !mapCenter) {
      setMapCenter([myLocation.lat, myLocation.lng]);
    }
  }, [myLocation, mapCenter]);

  const requestGPS = () => {
    trigger("medium");
    navigator.geolocation.getCurrentPosition(
      () => setGpsPermission('granted'),
      () => setGpsPermission('denied')
    );
  };

  const colleagues = useMemo(() => {
    const list = Object.values(onlineUsers).filter(u => u.user_id !== user?.id);
    if (!myLocation) return list;
    
    return list.map(u => {
      const dist = u.lat && u.lng ? getDistance(myLocation.lat, myLocation.lng, u.lat, u.lng) : null;
      const bear = u.lat && u.lng ? getBearing(myLocation.lat, myLocation.lng, u.lat, u.lng) : null;
      return { ...u, distance: dist, bearing: bear };
    }).sort((a, b) => (a.distance || 999) - (b.distance || 999));
  }, [onlineUsers, myLocation, user?.id]);

  const focusUser = (lat: number, lng: number) => {
    setMapCenter([lat, lng]);
    trigger("light");
  };

  return (
    <main className="h-screen bg-black text-white flex flex-col overflow-hidden">
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center justify-between z-[1000] pointer-events-none">
        <div className="flex items-center gap-4 pointer-events-auto">
          <Link href={`/pp/lists/${listId}`} className="p-3 rounded-2xl bg-zinc-950/80 backdrop-blur-md border border-white/10 text-zinc-400 hover:text-white shadow-2xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="bg-zinc-950/80 backdrop-blur-md border border-white/10 px-4 py-2 rounded-2xl shadow-2xl">
            <h1 className="text-sm font-bold tracking-tight">Radar GPS</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full ${myLocation ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
              <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest">{myLocation ? "Alta Precisão" : "Sincronizando..."}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 w-full bg-zinc-900 relative">
        {gpsPermission === 'denied' ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-zinc-950 p-8 text-center">
            <div className="w-24 h-24 rounded-[2rem] bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20 shadow-2xl">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2 max-w-xs">
              <h2 className="text-xl font-black">Acesso Bloqueado</h2>
              <p className="text-zinc-500 text-sm font-medium">O radar precisa do seu GPS para mostrar onde estão os outros membros.</p>
            </div>
            <button onClick={() => window.location.reload()} className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all">
              <RefreshCw className="w-4 h-4" /> Tentar Novamente
            </button>
          </div>
        ) : typeof window !== 'undefined' && L && mapCenter ? (
          <MapContainer center={mapCenter} zoom={18} className="h-full w-full" zoomControl={false}>
            <ChangeView center={mapCenter} zoom={18} />
            <TileLayer url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" subdomains={['mt0', 'mt1', 'mt2', 'mt3']} attribution="&copy; Google Maps" />
            
            {myLocation && (
              <Marker position={[myLocation.lat, myLocation.lng]} icon={L.divIcon({
                className: 'custom-icon',
                html: `<div class="relative"><div class="w-12 h-12 rounded-full border-4 border-indigo-500 bg-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden z-10 relative"><img src="${user?.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=EU&background=6366f1&color=fff`}" class="w-full h-full object-cover" alt="Eu" /></div><div class="absolute -inset-2 bg-indigo-500/20 rounded-full animate-ping" /></div>`,
                iconSize: [48, 48],
                iconAnchor: [24, 24]
              })}>
                <Popup>Você está aqui</Popup>
              </Marker>
            )}

            {colleagues.map(u => u.lat && u.lng && (
              <Marker key={u.user_id} position={[u.lat, u.lng]} icon={L.divIcon({
                className: 'custom-icon',
                html: `<div class="group relative flex flex-col items-center"><div class="w-10 h-10 rounded-full border-4 border-emerald-500 bg-zinc-900 shadow-2xl flex items-center justify-center overflow-hidden"><img src="${u.avatar_url || `https://ui-avatars.com/api/?name=${u.full_name}&background=10b981&color=fff`}" class="w-full h-full object-cover" alt="${u.full_name}" /></div><div class="mt-1 px-2 py-0.5 bg-black/80 rounded-full text-[8px] font-bold whitespace-nowrap border border-white/10 shadow-lg">${u.full_name.split(' ')[0]}</div></div>`,
                iconSize: [40, 60],
                iconAnchor: [20, 30]
              })}>
                <Popup>{u.full_name}</Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-zinc-950">
            <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center">
              <Navigation className="w-10 h-10 text-indigo-500 animate-spin" />
            </div>
            <p className="text-zinc-500 text-sm font-medium animate-pulse">Triangulando posição...</p>
            {gpsPermission === 'prompt' && (
              <button onClick={requestGPS} className="mt-4 px-4 py-2 bg-indigo-500 text-white rounded-lg text-xs font-bold uppercase tracking-widest">Ativar GPS</button>
            )}
          </div>
        )}
      </div>

      <div className="h-[38vh] bg-zinc-950 border-t border-white/10 z-[1001] flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mt-3 mb-2" />
        <div className="flex-1 overflow-y-auto px-6 pb-6 scrollbar-hide">
          <div className="flex flex-col gap-3">
            {colleagues.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700">
                  <User className="w-6 h-6" />
                </div>
                <p className="text-zinc-500 text-xs font-medium max-w-[200px]">Nenhum colaborador da lista está com a localização ativa.</p>
              </div>
            ) : (
              colleagues.map((u) => (
                <div key={u.user_id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 shadow-sm active:scale-[0.98] transition-all">
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-zinc-800 overflow-hidden border border-white/10 relative">
                        {u.avatar_url ? (
                          <Image src={u.avatar_url} fill className="object-cover" alt={u.full_name} sizes="48px" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-zinc-800 text-zinc-500 font-bold text-xs uppercase">
                            {u.full_name.charAt(0)}
                          </div>
                        )}
                      </div>
                      {u.bearing !== null && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-lg border-2 border-zinc-950 transition-transform duration-500" style={{ transform: `rotate(${u.bearing}deg)` }}>
                          <ChevronUp className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-zinc-100">{u.full_name}</h3>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${u.distance && u.distance < 10 ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-500"}`}>
                          {u.distance ? `${Math.round(u.distance)}m` : "Localizando..."}
                        </span>
                        {u.distance && u.distance < 10 && <span className="text-[10px] text-emerald-500 animate-pulse font-bold uppercase tracking-widest">Perto!</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => u.lat && u.lng && focusUser(u.lat, u.lng)} className="p-3 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white shadow-lg">
                      <MapIcon className="w-4 h-4" />
                    </button>
                    {u.phone ? (
                      <a href={`https://wa.me/${formatPhoneForWhatsApp(u.phone)}`} target="_blank" rel="noopener noreferrer" className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 shadow-lg hover:bg-emerald-500 hover:text-white transition-all" onClick={() => trigger('light')}>
                        <MessageCircleMore className="w-4 h-4" />
                      </a>
                    ) : (
                      <button disabled className="p-3 rounded-xl bg-zinc-900/50 text-zinc-800 cursor-not-allowed">
                        <MessageCircleMore className="w-4 h-4 opacity-20" />
                      </button>
                    )}
                    <button onClick={() => { trigger("light"); setChatTarget({ id: u.user_id, full_name: u.full_name, avatar_url: u.avatar_url }); setIsChatOpen(true); }} className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 shadow-lg">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <ListChat listId={listId} currentUser={user} isOpen={isChatOpen} onClose={() => { setIsChatOpen(false); setChatTarget(undefined); }} targetUser={chatTarget} />

      <style jsx global>{`
        .leaflet-container { background: #09090b !important; width: 100%; height: 100%; }
        .leaflet-tile-pane { filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%); }
        .leaflet-marker-icon, .leaflet-div-icon { background: none !important; border: none !important; }
      `}</style>
    </main>
  );
}
