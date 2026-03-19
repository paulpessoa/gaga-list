"use server"

// Nota: Em um ambiente real, você salvaria a assinatura no banco de dados (Supabase)
// Para seguir a documentação oficial, vamos simular o armazenamento

let subscription: PushSubscription | null = null

export async function subscribeUser(sub: PushSubscription) {
  subscription = sub
  // console.log('Assinatura salva no servidor:', sub)
  return { success: true }
}

export async function unsubscribeUser() {
  subscription = null
  return { success: true }
}

export async function sendNotification(message: string) {
  if (!subscription) {
    throw new Error("Nenhuma assinatura encontrada no servidor.")
  }

  // Em produção, aqui você usaria a biblioteca 'web-push' para disparar a notificação
  return { success: true }
}
