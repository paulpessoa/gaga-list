'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Salva a assinatura de Push no perfil do usuário logado no Supabase.
 */
export async function subscribeUser(sub: PushSubscription) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Não autenticado' }

  // Usamos casting para 'any' porque os tipos locais do banco podem estar desatualizados
  // em relação à nova coluna push_subscription criada via migração.
  const { error } = await (supabase
    .from('profiles') as any)
    .update({ push_subscription: sub })
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

  await (supabase
    .from('profiles') as any)
    .update({ push_subscription: null })
    .eq('id', user.id)

  return { success: true }
}
