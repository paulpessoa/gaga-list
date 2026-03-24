import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import { PLAN_CONFIGS } from "@/services/settings.service"

export const dynamic = 'force-dynamic';

console.log('🔄 Inicializando API de Checkout. Stripe configurado:', !!process.env.STRIPE_SECRET_KEY);

const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia' as any,
    })
  : null;

export async function POST(request: Request) {
  try {
    if (!stripe) {
      throw new Error(
        "Stripe não configurado. Adicione STRIPE_SECRET_KEY ao seu .env"
      )
    }
    const { planId } = await request.json()
    const plan = PLAN_CONFIGS[planId as keyof typeof PLAN_CONFIGS]

    if (!plan) {
      return NextResponse.json({ error: "Plano inválido" }, { status: 400 })
    }

    if (plan.amount === 0) {
      return NextResponse.json(
        { error: "Este plano é gratuito" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const appUrl =
      process.env.APP_URL ||
      request.headers.get("origin") ||
      "http://localhost:3000"

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: {
              name: `Pacote ${plan.name}`,
              description: `${plan.grains} Grãos para usar com IA`
            },
            unit_amount: plan.amount
          },
          quantity: 1
        }
      ],
      mode: "payment",
      success_url: `${appUrl}/app/credits?success=true`,
      cancel_url: `${appUrl}/app/plans?canceled=true`,
      customer_email: user.email,
      metadata: {
        userId: user.id,
        planId: planId,
        grains: plan.grains.toString()
      }
    })

    return NextResponse.json({ url: session.url })
  } catch (error: any) {
    console.error("Erro ao criar checkout session:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
