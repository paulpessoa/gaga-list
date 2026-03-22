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
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app/products") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <ShoppingBag className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Itens
        </span>
      </Link>

      <Link
        href="/app/recipes"
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app/recipes") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <UtensilsCrossed className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Receitas
        </span>
      </Link>

      <Link
        href="/app"
        onClick={() => trigger("medium")}
        className={`relative -top-6 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl active:scale-90 transition-all group border-4 border-white dark:border-zinc-950 ${isActive("/app") ? "bg-indigo-500 text-white shadow-indigo-500/40" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-400 dark:text-zinc-500"}`}
      >
        <LayoutGrid className="w-7 h-7 group-hover:scale-110 transition-transform" />
      </Link>

      <Link
        href="/app/people"
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 relative ${isActive("/app/people") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <Users className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Pessoas
        </span>
      </Link>

      <Link
        href="/app/profile"
        onClick={() => trigger("light")}
        className={`flex flex-col items-center gap-1 transition-all active:scale-90 ${isActive("/app/profile") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
      >
        <User className="w-5 h-5" />
        <span className="text-[9px] font-bold uppercase tracking-tighter">
          Perfil
        </span>
      </Link>
    </nav>
  )
}
