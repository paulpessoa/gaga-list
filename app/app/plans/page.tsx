"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import {
  ArrowLeft,
  Check,
  Sparkles,
  Zap,
  Wheat,
  Leaf,
  Tractor,
  Star,
  Loader2
} from "lucide-react"
import Link from "next/link"

import { SettingsService, PLAN_CONFIGS } from "@/services/settings.service"

const PLANS_DATA = [
  {
    id: "semente",
    icon: Leaf,
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
    features: ["50 Receitas IA", "25 Leituras de Foto", "Suporte Básico"],
    popular: false
  },
  {
    id: "broto",
    icon: Wheat,
    color: "text-[#53E076]",
    bgColor: "bg-[#1DB954]/10",
    features: [
      "500 Receitas IA",
      "250 Leituras de Foto",
      "Grãos nunca expiram",
      "Crachá Apoiador"
    ],
    popular: true
  },
  {
    id: "colheita",
    icon: Sparkles,
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
    features: [
      "1500 Receitas IA",
      "750 Leituras de Foto",
      "Prioridade na IA",
      "Suporte VIP"
    ],
    popular: false
  },
  {
    id: "fazenda",
    icon: Tractor,
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
    features: [
      "5000 Receitas IA",
      "2500 Leituras de Foto",
      "Acesso Antecipado",
      "GPS de Alta Precisão"
    ],
    popular: false
  }
]

export default function PlansPage() {
  const router = useRouter()
  const { trigger } = useHaptic()
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null)

  // Fusion static UI data with dynamic config
  const plans = PLANS_DATA.map(p => ({
    ...p,
    ...PLAN_CONFIGS[p.id as keyof typeof PLAN_CONFIGS]
  }))

  const handleSelectPlan = async (id: string) => {
    trigger("medium")

    if (id === "semente") {
      alert("Este plano é o inicial gratuito para novos usuários.")
      return
    }

    setLoadingPlan(id)
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: id })
      })

      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error(data.error || "Erro ao iniciar checkout")
      }
    } catch (err: any) {
      alert(
        `Erro: ${err.message}. Certifique-se de que as chaves do Stripe estão configuradas.`
      )
    } finally {
      setLoadingPlan(null)
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 pb-32 bg-[#131313]">
      <header className="flex flex-col gap-4">
        <Link
          href="/app/credits"
          onClick={() => trigger("light")}
          className="flex items-center gap-2 text-zinc-500 hover:text-[#53E076] transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-bold tracking-wide">
            Voltar para Energia IA
          </span>
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-[#e5e2e1] leading-tight">
            Escolha sua <span className="text-[#53E076]">Colheita</span>
          </h1>
          <p className="text-zinc-500 text-sm font-medium max-w-md">
            Adquira pacotes de grãos e libere o poder total da Inteligência
            Artificial em suas compras.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => {
          const Icon = plan.icon
          const isLoading = loadingPlan === plan.id

          return (
            <div
              key={plan.id}
              className={`relative p-8 rounded-[2.5rem] flex flex-col gap-6 transition-all duration-300 border-2 bg-[#1c1b1b]/60 ${plan.popular ? "border-[#53E076] shadow-2xl shadow-[#53E076]/20 scale-105 z-10" : "border-[#3d4a3d]/30 hover:border-[#53E076]/20"}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-[#1DB954] text-white text-[10px] font-bold tracking-wide px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" /> Recomendado
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div
                  className={`w-14 h-14 rounded-2xl ${plan.bgColor} ${plan.color} flex items-center justify-center shadow-inner`}
                >
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#e5e2e1]">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-[#53E076]">
                      {plan.priceLabel}
                    </span>
                    <span className="text-[10px] font-bold text-zinc-500 tracking-wide">
                      / pacote
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-3 px-4 bg-[#131313] rounded-2xl border border-[#3d4a3d]/60">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-[#e5e2e1]">
                  {plan.grains} Grãos
                </span>
              </div>

              <ul className="flex-1 space-y-3">
                {plan.features.map((feature, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-2.5 text-[11px] font-bold text-zinc-500"
                  >
                    <Check className="w-3.5 h-3.5 text-[#53E076] shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                disabled={!!loadingPlan}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 ${plan.popular ? "bg-[#1DB954] text-white" : "bg-[#201f1f] text-[#e5e2e1] border border-[#3d4a3d]/50 hover:bg-[#201f1f]/80"} disabled:opacity-50`}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Colher Agora"
                )}
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-10 rounded-[3rem] bg-[#1c1b1b] border border-[#3d4a3d]/40 text-center shadow-xl">
        <div className="flex items-center justify-center gap-3 text-[#53E076] mb-4">
          <Sparkles className="w-6 h-6" />
          <h4 className="font-bold tracking-wide text-xs">
            Garantia Staff
          </h4>
        </div>
        <p className="text-sm text-zinc-500 font-medium max-w-2xl mx-auto leading-relaxed">
          Nossos grãos não expiram. Compre agora e use quando precisar. Ao
          adquirir um pacote, você ajuda a manter o projeto ativo e livre de
          anúncios irritantes.
        </p>
      </div>
    </main>
  )
}

