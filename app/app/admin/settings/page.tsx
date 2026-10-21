import { redirect } from "next/navigation"

/** Configurações migraram para /admin/configuracoes. */
export default function LegacyAdminSettingsPage() {
  redirect("/admin/configuracoes")
}
