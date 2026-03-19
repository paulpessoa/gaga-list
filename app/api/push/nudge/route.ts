import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configuração do Web Push com as chaves do .env
webpush.setVapidDetails(
  'mailto:suporte@listapronta.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const { targetUserId, senderName } = await request.json()
    const supabase = await createClient()

    // 1. Buscar a assinatura push do usuário alvo
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('push_subscription, allow_notifications')
      .eq('id', targetUserId)
      .single()

    if (error || !profile?.push_subscription || profile.allow_notifications === false) {
      return NextResponse.json({ success: false, message: 'Usuário não possui push ativo' })
    }

    // 2. Preparar o payload da notificação
    const payload = JSON.stringify({
      title: 'Buzinada! 🔔',
      body: `${senderName} está te chamando na lista!`,
      icon: '/appstore-images/android/launchericon-192x192.png',
      badge: '/appstore-images/android/launchericon-48x48.png',
    })

    // 3. Enviar o Push via servidor
    await webpush.sendNotification(profile.push_subscription as any, payload)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Erro ao enviar Push Nudge:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
