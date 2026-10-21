import { redirect } from "next/navigation"

/** O painel admin mudou para /admin (layout próprio, checagem no servidor). */
export default function LegacyAdminPage() {
  redirect("/admin")
}
