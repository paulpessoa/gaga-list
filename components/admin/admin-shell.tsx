"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Cpu,
  PackageCheck,
  Settings,
  ArrowLeft,
  ShieldCheck
} from "lucide-react"

const NAV = [
  { href: "/admin", label: "Visão geral", icon: LayoutDashboard },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/ia", label: "Uso de IA", icon: Cpu },
  { href: "/admin/curadoria", label: "Curadoria", icon: PackageCheck },
  { href: "/admin/configuracoes", label: "Configurações", icon: Settings }
]

/**
 * Casca do painel admin — visual de "backoffice", propositalmente diferente do app:
 * claro, denso, tipografia menor, sem neon. PORQUÊ: deixa óbvio que você está
 * numa área de operação (e não no app do usuário), e prioriza leitura de números.
 *
 * Fica em `fixed inset-0` para se isolar do <body> escuro do root layout
 * (padding da TabBar, cor de fundo, etc.).
 */
export function AdminShell({
  children,
  adminName
}: {
  children: React.ReactNode
  adminName: string
}) {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href)

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col md:flex-row bg-[#f7f7f5] text-[#0b0b0b] font-[family-name:var(--font-inter)]"
      style={{ colorScheme: "light" }}
    >
      {/* Sidebar (desktop) / topo (mobile) */}
      <aside className="md:w-60 shrink-0 border-b md:border-b-0 md:border-r border-[#e4e3df] bg-white flex md:flex-col">
        <div className="hidden md:flex items-center gap-2 px-5 h-14 border-b border-[#e4e3df]">
          <ShieldCheck className="w-5 h-5 text-[#2a78d6]" />
          <span className="text-sm font-semibold tracking-tight">GagaList · Admin</span>
        </div>
        <nav className="flex md:flex-col gap-1 p-2 md:p-3 overflow-x-auto flex-1" aria-label="Admin">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={`flex items-center gap-2.5 whitespace-nowrap rounded-md px-3 py-2 text-[13px] font-medium transition-colors ${
                  active
                    ? "bg-[#2a78d6]/10 text-[#1d5fae]"
                    : "text-[#52514e] hover:bg-[#f0efec] hover:text-[#0b0b0b]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
        <div className="hidden md:block p-3 border-t border-[#e4e3df] space-y-2">
          <p className="px-3 text-[11px] text-[#8a8983] truncate">Logado como {adminName}</p>
          <Link
            href="/app"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-[#52514e] hover:bg-[#f0efec]"
          >
            <ArrowLeft className="w-4 h-4" /> Voltar ao app
          </Link>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-8">{children}</div>
      </main>
    </div>
  )
}
