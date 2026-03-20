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
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Central de Avisos
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Clique para abrir a conversa ou lixeira
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClear}
            className="p-3 rounded-2xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-red-500 transition-colors flex items-center gap-2 text-[10px] font-black uppercase tracking-widest border border-zinc-200 dark:border-white/5"
          >
            <Trash2 className="w-4 h-4" />
            Limpar
          </button>
        )}
      </header>

      <div className="flex flex-col gap-3">
        {notifications.length === 0 ? (
          <div className="glass-panel rounded-[2.5rem] p-16 flex flex-col items-center justify-center text-center gap-6">
            <div className="w-24 h-24 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-200 dark:text-zinc-800 shadow-inner">
              <Bell className="w-12 h-12" />
            </div>
            <div className="space-y-2">
              <h2 className="text-zinc-900 dark:text-white font-black text-xl">Tudo limpo por aqui</h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-[240px]">
                Você não tem notificações recentes no momento.
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
                className="glass-panel p-6 rounded-[2rem] flex items-start gap-5 animate-in slide-in-from-right-4 duration-300 hover:border-indigo-500/30 dark:hover:border-indigo-500/20 transition-all group relative active:scale-[0.98]"
              >
                <div
                  className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm transition-transform group-hover:scale-110 duration-300 ${notif.type === "dm" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400" : "bg-amber-500/10 text-amber-600 dark:text-amber-500"}`}
                >
                  {notif.type === "dm" ? (
                    <MessageSquare className="w-7 h-7" />
                  ) : (
                    <Smartphone className="w-7 h-7 animate-shake" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-sm uppercase tracking-tight">
                      {notif.type === "dm"
                        ? "Nova Mensagem"
                        : "Chamada no Radar"}
                    </h3>
                    <span className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-lg">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.time).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed pr-8 line-clamp-2">
                    <span className="text-zinc-900 dark:text-white font-black">
                      {notif.senderName}
                    </span>
                    {notif.type === "dm"
                      ? `: "${notif.message}"`
                      : " está tentando chamar sua atenção agora!"}
                  </p>
                  {notif.listTitle && (
                    <div className="inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/10">
                      <span className="text-[9px] text-indigo-500 font-black uppercase tracking-widest">
                        {notif.listTitle}
                      </span>
                    </div>
                  )}
                </div>

                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-zinc-300 dark:text-zinc-800 group-hover:text-indigo-500 transition-colors">
                  <ChevronRight className="w-6 h-6" />
                </div>
              </Link>
            )
          })
        )}
      </div>

      <div className="mt-4 p-8 rounded-[2.5rem] bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 dark:border-indigo-500/5">
        <p className="text-[10px] text-indigo-500/60 dark:text-indigo-400/40 text-center font-black uppercase tracking-[0.2em] leading-relaxed">
          Dica: Mensagens individuais são efêmeras e não ficam salvas após
          limpar esta lista.
        </p>
      </div>
    </main>
  )
}
