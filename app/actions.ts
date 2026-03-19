'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Salva a assinatura de Push no perfil do usuário logado no Supabase.
 */
export async function subscribeUser(sub: PushSubscription) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Não autenticado' }

  // Salva o JSON da assinatura no campo push_subscription da tabela profiles
  const { error } = await supabase
    .from('profiles')
    .update({ push_subscription: sub as any })
    .eq('id', user.id)

  if (error) {
    console.error('Erro ao salvar assinatura push:', error)
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Remove a assinatura de Push.
 */
export async function unsubscribeUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false }

  await supabase
    .from('profiles')
    .update({ push_subscription: null })
    .eq('id', user.id)

  return { success: true }
}
