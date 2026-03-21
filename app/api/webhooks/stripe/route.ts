import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseServerClient } from '@/lib/supabase/server';
import { headers } from 'next/headers';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24-preview' as any,
    })
  : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * POST /api/webhooks/stripe
 * Recebe notificações de eventos do Stripe para processar pagamentos.
 * 
 * PORQUÊ: O Webhook é o método mais seguro para entregar produtos digitais (grãos),
 * pois garante que o crédito só ocorra após a confirmação real do pagamento pelo Stripe,
 * independente de quedas de conexão no navegador do usuário.
 */
export async function POST(request: Request) {
  if (!stripe || !webhookSecret) {
    console.error('Stripe ou Webhook Secret não configurados.');
    return NextResponse.json({ error: 'Configuração pendente' }, { status: 500 });
  }

  const body = await request.text();
  const sig = (await headers()).get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err: any) {
    console.error(`❌ Erro na assinatura do Webhook: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  // Lógica para o evento de checkout concluído
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Extraímos os dados que salvamos nos metadados durante a criação da sessão
    const userId = session.metadata?.userId;
    const grainsToAdd = parseInt(session.metadata?.grains || '0');

    if (!userId || isNaN(grainsToAdd)) {
      console.error('Dados de usuário ou grãos ausentes nos metadados da sessão.');
      return NextResponse.json({ error: 'Metadados inválidos' }, { status: 400 });
    }

    console.log(`🔔 Pagamento confirmado! Adicionando ${grainsToAdd} grãos ao usuário ${userId}`);

    try {
      // 1. Buscar saldo atual (usando o admin client para ignorar RLS)
      const { data: profile, error: fetchError } = await supabaseServerClient
        .from('profiles')
        .select('credits')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      const currentCredits = profile?.credits ?? 0;
      const newBalance = currentCredits + grainsToAdd;

      // 2. Atualizar o saldo do usuário
      const { error: updateError } = await supabaseServerClient
        .from('profiles')
        .update({ credits: newBalance })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 3. Registrar o log de recarga
      await supabaseServerClient
        .from('ai_usage_logs')
        .insert({
          user_id: userId,
          feature: 'recharge',
          cost: -grainsToAdd, // Custo negativo indica ganho de créditos
          model_used: 'stripe-payment'
        });

      console.log(`✅ Sucesso! Usuário ${userId} agora tem ${newBalance} grãos.`);
    } catch (err: any) {
      console.error(`❌ Erro ao atualizar créditos no banco: ${err.message}`);
      return NextResponse.json({ error: 'Erro ao processar saldo' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
