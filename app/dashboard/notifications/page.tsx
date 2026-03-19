"use client"

import { useNotifications } from "@/providers/notification-provider"
import {
  Bell,
  MessageSquare,
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
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="hidden md:block text-3xl font-bold tracking-tight text-white">
            Central de Avisos
          </h1>
          <p className="hidden md:block text-sm text-zinc-500">
            Clique em um aviso para abrir a conversa
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClear}
            className="p-3 rounded-2xl bg-zinc-900 text-zinc-400 hover:text-red-400 transition-colors flex items-center gap-2 text-xs font-bold uppercase tracking-widest"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="glass-panel rounded-3xl p-12 flex flex-col items-center justify-center text-center gap-4 border border-white/5 bg-zinc-950/40">
            <div className="w-20 h-20 rounded-full bg-zinc-900 flex items-center justify-center text-zinc-700">
              <Bell className="w-10 h-10 opacity-20" />
            </div>
            <div>
              <h2 className="text-zinc-400 font-bold">Tudo limpo por aqui</h2>
              <p className="text-zinc-600 text-sm">
                Você não tem notificações recentes.
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => {
            // Construir a URL de destino
            const baseUrl = `/dashboard/lists/${notif.listId}`
            const queryParams = new URLSearchParams()
            queryParams.set("openChat", "true")
            if (notif.type === "dm" && notif.senderId) {
              queryParams.set("targetId", notif.senderId)
            }
            const destinationUrl = `${baseUrl}?${queryParams.toString()}`

            return (
              <Link
                key={notif.id}
                href={destinationUrl}
                onClick={() => trigger("light")}
                className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-900/50 flex items-start gap-4 animate-in slide-in-from-right-4 duration-300 hover:bg-zinc-800/50 transition-colors group relative"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${notif.type === "dm" ? "bg-indigo-500/10 text-indigo-400" : "bg-amber-500/10 text-amber-500"}`}
                >
                  {notif.type === "dm" ? (
                    <MessageSquare className="w-6 h-6" />
                  ) : (
                    <Smartphone className="w-6 h-6 animate-bounce" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-zinc-100 text-sm">
                      {notif.type === "dm"
                        ? "Nova Mensagem"
                        : "Chamada no Radar"}
                    </h3>
                    <span className="text-[10px] text-zinc-600 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-400 text-sm leading-relaxed pr-6">
                    <span className="text-white font-semibold">
                      {notif.senderName}
                    </span>
                    {notif.type === "dm"
                      ? `: "${notif.message}"`
                      : " está tentando chamar sua atenção!"}
                  </p>
                  {notif.listTitle && (
                    <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider mt-2">
                      Lista: {notif.listTitle}
                    </p>
                  )}
                </div>

                <div className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-700 group-hover:text-zinc-400 transition-colors">
                  <ChevronRight className="w-5 h-5" />
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div className="mt-4 p-6 rounded-3xl bg-indigo-500/5 border border-indigo-500/10">
        <p className="text-[10px] text-indigo-400/60 text-center font-bold uppercase tracking-[0.2em]">
          Dica: Mensagens individuais são efêmeras e não ficam salvas após
          limpar esta lista.
        </p>
      </div>
    </main>
  )
}
