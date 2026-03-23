import { NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

// Configuração do Web Push
webpush.setVapidDetails(
  'mailto:suporte@listapronta.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { type, targetUserId, senderName, email, invitedBy } = body
    const supabase = await createClient()

    // FLUXO 1: Buzinada (Nudge)
    if (!type || type === 'nudge') {
      const { data: profile, error } = await (supabase
        .from('profiles') as any)
        .select('push_subscription, allow_notifications')
        .eq('id', targetUserId)
        .single()

      if (error || !profile?.push_subscription || profile.allow_notifications === false) {
        return NextResponse.json({ success: false, message: 'Usuário não possui push ativo' })
      }

      const payload = JSON.stringify({
        title: 'Buzinada! 🔔',
        body: `${senderName} está te chamando na lista!`,
        icon: '/appstore-images/android/launchericon-192x192.png',
        badge: '/appstore-images/android/launchericon-48x48.png',
      })

      await webpush.sendNotification(profile.push_subscription as any, payload)
      return NextResponse.json({ success: true })
    }

    // FLUXO 2: Convite por E-mail (Referral)
    if (type === 'invite_referral') {
      if (!email || !invitedBy) {
        return NextResponse.json({ error: 'Dados insuficientes para convite' }, { status: 400 })
      }

      // Registrar na tabela de convites pendentes para o bônus futuro
      // Note: Aqui usamos a tabela 'pending_invitations' mas com uma flag ou sem list_id
      // para indicar que é um convite global do app.
      const { error } = await (supabase
        .from('pending_invitations') as any)
        .upsert({
          email: email.toLowerCase(),
          invited_by: invitedBy,
        }, { onConflict: 'email' })

      if (error) {
        console.error('Erro ao registrar convite:', error)
        return NextResponse.json({ error: 'Erro ao registrar convite' }, { status: 500 })
      }

      // Aqui dispararíamos um e-mail real via Resend/SendGrid no futuro.
      // Por enquanto, apenas confirmamos o registro do referral.
      return NextResponse.json({ success: true, message: 'Referral registrado' })
    }

    return NextResponse.json({ error: 'Tipo de ação inválido' }, { status: 400 })

  } catch (error: any) {
    console.error('Erro na rota de notificações:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
