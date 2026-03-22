"use client"

import {
  LayoutGrid,
  Settings,
  Bell,
  ScanLine,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  User
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNotifications } from "@/providers/notification-provider"
import { useHaptic } from "@/hooks/use-haptic"

interface TabBarProps {
  onScanClick?: () => void
}

export function TabBar({ onScanClick }: TabBarProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  const { trigger } = useHaptic()

  const isActive = (path: string) => pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-xl border-t border-zinc-100 dark:border-white/5 flex items-center justify-around px-2 z-50 md:hidden transition-colors duration-300">
      <Link
        href="/app/products"
        aria-current={isActive("/app/products") ? "page" : undefined}
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app/products") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <ShoppingBag className={`w-5 h-5 ${isActive("/app/products") ? "fill-indigo-500/20" : ""}`} />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Itens
        </span>
      </Link>

      <Link
        href="/app/recipes"
        aria-current={isActive("/app/recipes") ? "page" : undefined}
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app/recipes") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <UtensilsCrossed className={`w-5 h-5 ${isActive("/app/recipes") ? "fill-indigo-500/20" : ""}`} />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Receitas
        </span>
      </Link>

      <Link
        href="/app"
        aria-current={isActive("/app") ? "page" : undefined}
        onClick={() => trigger("medium")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <LayoutGrid className={`w-6 h-6 ${isActive("/app") ? "fill-indigo-500/20" : ""}`} />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Listas
        </span>
      </Link>

      <Link
        href="/app/notifications"
        aria-current={isActive("/app/notifications") ? "page" : undefined}
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 relative ${isActive("/app/notifications") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <Bell className={`w-5 h-5 ${isActive("/app/notifications") ? "fill-indigo-500/20" : ""}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[1rem] h-[1rem] bg-rose-500 text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-zinc-950 px-1 animate-pulse">
            {unreadCount}
          </span>
        )}
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Avisos
        </span>
      </Link>

      <Link
        href="/app/profile"
        aria-current={isActive("/app/profile") ? "page" : undefined}
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app/profile") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <Settings className={`w-5 h-5 ${isActive("/app/profile") ? "fill-indigo-500/20" : ""}`} />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Config
        </span>
      </Link>
    </nav>
  )
}
