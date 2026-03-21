import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-02-24-preview' as any,
    })
  : null;

const PLANS_CONFIG: Record<string, { name: string; amount: number; grains: number }> = {
  semente: { name: 'Pacote Semente', amount: 0, grains: 50 },
  broto: { name: 'Pacote Broto', amount: 990, grains: 500 }, // R$ 9,90
  colheita: { name: 'Pacote Colheita', amount: 1990, grains: 1500 }, // R$ 19,90
  fazenda: { name: 'Pacote Fazenda', amount: 14900, grains: 5000 }, // R$ 149,00
};

export async function POST(request: Request) {
  try {
    if (!stripe) {
      throw new Error('Stripe não configurado. Adicione STRIPE_SECRET_KEY ao seu .env');
    }
    const { planId } = await request.json();
    const plan = PLANS_CONFIG[planId];

    if (!plan) {
      return NextResponse.json({ error: 'Plano inválido' }, { status: 400 });
    }

    if (plan.amount === 0) {
      return NextResponse.json({ error: 'Este plano é gratuito' }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
    }

    const appUrl = process.env.APP_URL || request.headers.get('origin') || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'brl',
            product_data: {
              name: plan.name,
              description: `${plan.grains} Grãos para usar com IA`,
            },
            unit_amount: plan.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/pp/credits?success=true`,
      cancel_url: `${appUrl}/pp/plans?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: planId,
        grains: plan.grains.toString(),
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error('Erro ao criar checkout session:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
