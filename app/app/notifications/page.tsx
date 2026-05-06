"use client"

import { useNotifications } from "@/providers/notification-provider"
import {
  Bell,
  Trash2,
  Clock,
  Smartphone,
  ChevronRight
} from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"
import Link from "next/link"

export default function NotificationsPage() {
  const { notifications, clearNotifications } = useNotifications()
  const { trigger } = useHaptic()

  const handleClear = () => {
    trigger("heavy")
    clearNotifications()
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-[#131313]">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-[#e5e2e1] leading-tight">
            Mensagens
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Acompanhe o que as suas duplas estão falando
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClear}
            className="p-3 rounded-2xl bg-[#1c1b1b] text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-[#3d4a3d]/60 shadow-xl"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="flex flex-col gap-6">
            <div className="rounded-[3rem] p-16 flex flex-col items-center justify-center text-center gap-6 bg-[#1c1b1b]/40 border-2 border-dashed border-[#3d4a3d]/60">
              <div className="w-24 h-24 rounded-[2.5rem] bg-[#1c1b1b] flex items-center justify-center text-zinc-800 shadow-xl border border-[#3d4a3d]/60">
                <Bell className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h2 className="text-[#e5e2e1] font-black text-xl tracking-tight">
                  Tudo limpo por aqui
                </h2>
                <p className="text-[#bccbb9] text-sm font-medium max-w-[240px] leading-relaxed">
                  Você não tem avisos pendentes. Que tal convidar alguém para
                  sua próxima lista?
                </p>
              </div>
            </div>

          </div>
        ) : (
          notifications.map((notif) => {
            // Construir a URL de destino
            const baseUrl = `/app/lists/${notif.listId}`
            const queryParams = new URLSearchParams()
            queryParams.set("openChat", "true")
            const destinationUrl = `${baseUrl}?${queryParams.toString()}`

            return (
              <Link
                key={notif.id}
                href={destinationUrl}
                onClick={() => trigger("light")}
                className="p-6 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-right-4 duration-300 border border-[#3d4a3d]/30 bg-[#1c1b1b]/60 hover:border-[#53E076]/20 transition-all group relative active:scale-[0.98] shadow-sm"
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300 bg-amber-500/10 text-amber-500"
                >
                  <Smartphone className="w-7 h-7 animate-shake" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-black text-zinc-100 text-sm uppercase tracking-tight">
                      {notif.type === "dm" ? "Nova Mensagem" : "Atenção!"}
                    </h3>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-[#201f1f] px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-[#bccbb9] text-sm leading-relaxed pr-8 line-clamp-2">
                    <span className="text-[#e5e2e1] font-black">
                      {notif.senderName}
                    </span>
                    {notif.type === "dm" 
                      ? `: "${notif.message}"` 
                      : " está tentando chamar sua atenção agora!"}
                  </p>
                  {notif.listTitle && (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 rounded-md bg-[#1DB954]/10 border border-[#53E076]/10">
                      <span className="text-[9px] text-[#53E076] font-black uppercase tracking-widest">
                        {notif.listTitle}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-800 group-hover:text-[#53E076] transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}

