"use client"

import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Plus, ShieldCheck } from "lucide-react"
import { useNotifications } from "@/providers/notification-provider"
import { useProfile } from "@/hooks/use-user"
import {
  PRIMARY_NAV,
  SECONDARY_NAV,
  isNavActive,
  getContextualAction,
  type NavItem
} from "./nav-items"

/**
 * SideNav — navegação lateral para telas >= md (tablet/desktop).
 * PORQUÊ: no desktop a TabBar flutuante fica perdida no rodapé de uma tela larga;
 * uma barra lateral fixa é o padrão esperado (Notion, Todoist, Spotify).
 * - md (768–1023px): trilho compacto só com ícones (80px)
 * - lg (>= 1024px): barra completa com rótulos (256px)
 * O conteúdo é deslocado em `app/app/layout.tsx` com md:pl-20 / lg:pl-64.
 */
export function SideNav() {
  const pathname = usePathname()
  const { unreadCount } = useNotifications()
  const { data: profile } = useProfile()
  const action = getContextualAction(pathname)

  return (
    <aside
      className="hidden md:flex fixed inset-y-0 left-0 z-40 w-20 lg:w-64 flex-col gap-6 border-r border-[#3d4a3d]/50 bg-[#0e0e0e] px-3 lg:px-4 py-6"
      aria-label="Navegação lateral"
    >
      <Link href="/app" className="flex items-center gap-3 px-2 lg:px-3">
        <Image
          src="/icons/icon-192x192.png"
          alt=""
          width={36}
          height={36}
          className="rounded-xl shrink-0"
        />
        <span className="hidden lg:inline text-lg font-black tracking-tight text-[#e5e2e1]">
          Gaga<span className="text-[#53E076]">List</span>
        </span>
      </Link>

      {action && (
        <button
          onClick={() => window.dispatchEvent(new CustomEvent(action.event))}
          className="flex items-center justify-center lg:justify-start gap-2 h-12 rounded-2xl bg-[#1DB954] text-[#003914] font-black text-sm px-3 lg:px-4 hover:bg-[#53E076] transition-colors neon-glow-sm"
          aria-label={action.label}
          title={action.label}
        >
          <Plus className="w-5 h-5 shrink-0" />
          <span className="hidden lg:inline">{action.label}</span>
        </button>
      )}

      <nav className="flex flex-col gap-1" aria-label="Principal">
        {PRIMARY_NAV.map((item) => (
          <SideNavLink
            key={item.href}
            item={item}
            active={isNavActive(pathname, item.href)}
            badge={item.href === "/app/notifications" ? unreadCount : 0}
          />
        ))}
      </nav>

      <div className="h-px bg-[#3d4a3d]/50 mx-2" />

      <nav className="flex flex-col gap-1" aria-label="Atalhos">
        {SECONDARY_NAV.map((item) => (
          <SideNavLink
            key={item.href}
            item={item}
            active={isNavActive(pathname, item.href)}
            subtle
          />
        ))}
      </nav>

      {profile?.is_admin && (
        <div className="mt-auto">
          <SideNavLink
            item={{ href: "/admin", icon: ShieldCheck, label: "Painel Admin" }}
            active={pathname.startsWith("/app/admin") || pathname.startsWith("/admin")}
            subtle
          />
        </div>
      )}
    </aside>
  )
}

function SideNavLink({
  item,
  active,
  badge = 0,
  subtle = false
}: {
  item: NavItem
  active: boolean
  badge?: number
  subtle?: boolean
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      title={item.label}
      className={`
        relative flex items-center justify-center lg:justify-start gap-3 h-11 px-3 rounded-xl
        text-sm font-bold transition-colors
        ${active
          ? "bg-[#53E076]/10 text-[#53E076]"
          : subtle
            ? "text-[#bccbb9]/50 hover:text-[#e5e2e1] hover:bg-white/5"
            : "text-[#bccbb9]/80 hover:text-[#e5e2e1] hover:bg-white/5"}
      `}
    >
      <Icon className="w-5 h-5 shrink-0" strokeWidth={active ? 2.5 : 1.8} />
      <span className="hidden lg:inline">{item.label}</span>
      {badge > 0 && (
        <span className="absolute top-1.5 left-7 lg:static lg:ml-auto min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  )
}
