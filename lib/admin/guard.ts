import { redirect } from "next/navigation"
import { createClient, supabaseServerClient } from "@/lib/supabase/server"

/**
 * Garante, NO SERVIDOR, que quem acessa o /admin é administrador.
 * PORQUÊ: o admin antigo checava is_admin no cliente (o HTML/JS já tinha
 * sido entregue). Aqui o redirect acontece antes de qualquer dado sair.
 *
 * - Sem sessão  -> volta para a landing (/)
 * - Sem is_admin -> volta para o app (/app)
 */
export async function requireAdmin() {
  const supabase = await createClient()
  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect("/")

  const { data: profile } = await supabaseServerClient
    .from("profiles")
    .select("is_admin, full_name, email, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile?.is_admin) redirect("/app")

  return { user, profile }
}
