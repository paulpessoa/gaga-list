"use client"

import {
  LayoutGrid,
  Settings,
  Bell,
  ScanLine,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  User,
  Plus
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useNotifications } from "@/providers/notification-provider"
import { useHaptic } from "@/hooks/use-haptic"
import { motion, AnimatePresence } from "framer-motion"

interface TabBarProps {
  onScanClick?: () => void
  actionButton?: {
    icon?: React.ReactNode
    label: string
    onClick: () => void
  }
}

export function TabBar({ onScanClick, actionButton }: TabBarProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  const { trigger } = useHaptic()

  const isActive = (path: string) => pathname === path

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:hidden pointer-events-none">
      <div className="max-w-md mx-auto flex items-end gap-3 pointer-events-auto">
        {/* Main Navigation Bar */}
        <motion.nav 
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`flex-1 h-16 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200/50 dark:border-white/5 rounded-[2rem] flex items-center justify-around px-2 shadow-2xl shadow-black/10 transition-colors duration-300`}
        >
          <Link
            href="/app"
            aria-current={isActive("/app") ? "page" : undefined}
            onClick={() => trigger("medium")}
            className={`flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-90 ${isActive("/app") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
          >
            <LayoutGrid className={`w-5 h-5 ${isActive("/app") ? "fill-indigo-500/20" : ""}`} />
            <span className="text-[8px] font-black uppercase tracking-tighter">
              Listas
            </span>
          </Link>

          <Link
            href="/app/recipes"
            aria-current={isActive("/app/recipes") ? "page" : undefined}
            onClick={() => trigger("light")}
            className={`flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-90 ${isActive("/app/recipes") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
          >
            <UtensilsCrossed className={`w-5 h-5 ${isActive("/app/recipes") ? "fill-indigo-500/20" : ""}`} />
            <span className="text-[8px] font-black uppercase tracking-tighter">
              Receitas
            </span>
          </Link>

          <Link
            href="/app/people"
            aria-current={isActive("/app/people") ? "page" : undefined}
            onClick={() => trigger("light")}
            className={`flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-90 ${isActive("/app/people") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
          >
            <Users className={`w-5 h-5 ${isActive("/app/people") ? "fill-indigo-500/20" : ""}`} />
            <span className="text-[8px] font-black uppercase tracking-tighter">
              Pessoas
            </span>
          </Link>

          <Link
            href="/app/profile"
            aria-current={isActive("/app/profile") ? "page" : undefined}
            onClick={() => trigger("light")}
            className={`flex-1 flex flex-col items-center gap-0.5 transition-all active:scale-90 ${isActive("/app/profile") ? "text-indigo-500 dark:text-indigo-400" : "text-zinc-400 dark:text-zinc-500 hover:text-indigo-500"}`}
          >
            <User className={`w-5 h-5 ${isActive("/app/profile") ? "fill-indigo-500/20" : ""}`} />
            <span className="text-[8px] font-black uppercase tracking-tighter">
              Perfil
            </span>
          </Link>
        </motion.nav>

        {/* Contextual Action Button */}
        <AnimatePresence mode="popLayout">
          {actionButton && (
            <motion.button
              key="action-button"
              initial={{ scale: 0, x: 20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0, x: 20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => {
                trigger("medium");
                actionButton.onClick();
              }}
              className="w-16 h-16 bg-indigo-500 dark:bg-white text-white dark:text-indigo-600 rounded-[1.75rem] flex items-center justify-center shadow-2xl shadow-indigo-500/30 dark:shadow-white/10 active:scale-90 transition-transform flex-shrink-0"
            >
              {actionButton.icon || <Plus className="w-8 h-8" />}
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
