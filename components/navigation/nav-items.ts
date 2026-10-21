import {
  LayoutGrid,
  UtensilsCrossed,
  Users,
  User,
  Bell,
  Zap,
  Crown,
  HelpCircle,
  Trash2,
  type LucideIcon
} from "lucide-react"

export interface NavItem {
  href: string
  icon: LucideIcon
  label: string
}

/**
 * Itens principais de navegação — fonte única usada pela TabBar (mobile)
 * e pela SideNav (desktop). PORQUÊ: evitar que os dois menus divirjam.
 */
export const PRIMARY_NAV: NavItem[] = [
  { href: "/app", icon: LayoutGrid, label: "Listas" },
  { href: "/app/recipes", icon: UtensilsCrossed, label: "Receitas" },
  { href: "/app/notifications", icon: Bell, label: "Mensagens" },
  { href: "/app/people", icon: Users, label: "Pessoas" },
  { href: "/app/profile", icon: User, label: "Perfil" }
]

/** Atalhos secundários: só aparecem na SideNav, onde há espaço sobrando. */
export const SECONDARY_NAV: NavItem[] = [
  { href: "/app/credits", icon: Zap, label: "Grãos" },
  { href: "/app/plans", icon: Crown, label: "Planos" },
  { href: "/app/help", icon: HelpCircle, label: "Ajuda" },
  { href: "/app/trash", icon: Trash2, label: "Lixeira" }
]

/** Rota ativa: "/app" só bate exato; as demais aceitam sub-rotas. */
export function isNavActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app" || pathname.startsWith("/app/lists")
  return pathname === href || pathname.startsWith(`${href}/`)
}

/**
 * Botão de ação contextual (FAB no mobile, botão na SideNav no desktop).
 * Dispara os mesmos CustomEvents que as páginas já escutam.
 */
export function getContextualAction(pathname: string) {
  if (pathname === "/app") {
    return { label: "Nova Lista", event: "open-create-list" }
  }
  if (/^\/app\/lists\/[^/]+$/.test(pathname)) {
    return { label: "Novo Item", event: "open-create-item" }
  }
  return null
}
