"use client"

import {
  LayoutGrid,
  UtensilsCrossed,
  Users,
  User,
  Plus,
  Bell
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

/**
 * TabBar — Navegação principal do GagaList Pro.
 * Design: Glassmorphism com identidade "Electric Sophistication".
 * Cor ativa: Neon Green (#53E076) com glow effect.
 */
export function TabBar({ onScanClick, actionButton }: TabBarProps) {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  const { trigger } = useHaptic()

  const isActive = (path: string) => pathname === path

  const navItems = [
    { href: "/app",          icon: LayoutGrid,      label: "Listas"   },
    { href: "/app/recipes",  icon: UtensilsCrossed, label: "Receitas" },
    { href: "/app/notifications", icon: Bell,       label: "Avisos"   },
    { href: "/app/people",   icon: Users,           label: "Pessoas"  },
    { href: "/app/profile",  icon: User,            label: "Perfil"   },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-6 md:hidden pointer-events-none">
      <div className="max-w-md mx-auto flex items-end gap-3 pointer-events-auto">

        {/* FAB — Botão Contextual de Ação */}
        <AnimatePresence mode="popLayout">
          {actionButton && (
            <motion.button
              key="action-button"
              initial={{ scale: 0, x: -20, opacity: 0 }}
              animate={{ scale: 1, x: 0, opacity: 1 }}
              exit={{ scale: 0, x: -20, opacity: 0 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              onClick={() => {
                trigger("medium")
                actionButton.onClick()
              }}
              className="
                w-16 h-16 rounded-[1.75rem] flex items-center justify-center
                bg-[#1DB954] text-[#003914]
                shadow-2xl neon-glow
                active:scale-90 transition-transform flex-shrink-0
                relative overflow-hidden
              "
              aria-label={actionButton.label}
            >
              {/* Shimmer interno */}
              <span
                className="absolute inset-0 bg-gradient-to-br from-[#53E076]/30 to-transparent pointer-events-none"
                aria-hidden
              />
              {actionButton.icon || <Plus className="w-8 h-8 relative z-10" />}
            </motion.button>
          )}
        </AnimatePresence>

        {/* Nav Principal — Glass */}
        <motion.nav
          layout
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="
            flex-1 h-16
            glass-panel
            rounded-[2rem]
            flex items-center justify-around px-2
          "
          role="navigation"
          aria-label="Navegação principal"
        >
          {navItems.map(({ href, icon: Icon, label }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                onClick={() => trigger("medium")}
                className={`
                  flex-1 flex flex-col items-center gap-0.5
                  transition-all duration-200 active:scale-90
                  ${active
                    ? "text-[#53E076] tab-active-glow"
                    : "text-[#bccbb9]/60 hover:text-[#bccbb9]"
                  }
                `}
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-all ${
                      active ? "scale-110" : ""
                    }`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {href === "/app/notifications" && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 text-white text-[7px] font-black flex items-center justify-center rounded-full border-2 border-[#131313] animate-bounce">
                      {unreadCount}
                    </span>
                  )}
                </div>
                <span
                  className={`
                    text-[8px] font-black uppercase tracking-tighter
                    ${active ? "opacity-100" : "opacity-70"}
                  `}
                >
                  {label}
                </span>
                {/* Indicador ativo — dot neon */}
                {active && (
                  <motion.span
                    layoutId="tab-indicator"
                    className="absolute bottom-1 w-1 h-1 rounded-full bg-[#53E076] neon-glow-sm"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            )
          })}
        </motion.nav>

      </div>
    </div>
  )
}
