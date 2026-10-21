import type { Metadata } from "next"
import { requireAdmin } from "@/lib/admin/guard"
import { AdminShell } from "@/components/admin/admin-shell"

export const metadata: Metadata = {
  title: "Admin · GagaList",
  robots: { index: false, follow: false }
}

// Sempre renderiza no request: os números mudam e a checagem de admin é por sessão.
export const dynamic = "force-dynamic"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin()
  return <AdminShell adminName={profile.full_name || profile.email}>{children}</AdminShell>
}
