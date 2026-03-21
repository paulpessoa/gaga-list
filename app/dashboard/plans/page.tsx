"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { ArrowLeft, Check, Sparkles, Zap, Wheat, Leaf, Tractor, Star } from "lucide-react"
import Link from "next/link"

const PLANS = [
  {
    id: 'semente',
    name: 'Semente',
    price: 'Grátis',
    grains: 50,
    icon: Leaf,
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/10',
    features: ['50 Receitas IA', '25 Leituras de Foto', 'Suporte Básico'],
    popular: false
  },
  {
    id: 'broto',
    name: 'Broto',
    price: 'R$ 9,90',
    grains: 500,
    icon: Wheat,
    color: 'text-indigo-500',
    bgColor: 'bg-indigo-500/10',
    features: ['500 Receitas IA', '250 Leituras de Foto', 'Grãos nunca expiram', 'Crachá Apoiador'],
    popular: true
  },
  {
    id: 'colheita',
    name: 'Colheita',
    price: 'R$ 19,90',
    grains: 1500,
    icon: Sparkles,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
    features: ['1500 Receitas IA', '750 Leituras de Foto', 'Prioridade na IA', 'Suporte VIP'],
    popular: false
  },
  {
    id: 'fazenda',
    name: 'Fazenda',
    price: 'R$ 149,00',
    grains: 5000,
    icon: Tractor,
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/10',
    features: ['5000 Receitas IA', '2500 Leituras de Foto', 'Acesso Antecipado', 'GPS de Alta Precisão'],
    popular: false
  }
]

export default function PlansPage() {
  const router = useRouter()
  const { trigger } = useHaptic()
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const handleSelectPlan = (id: string) => {
    trigger('medium')
    setSelectedPlan(id)
    // Aqui no futuro entraria a lógica de checkout do Stripe/Apacate Pay
    alert(`Checkout para o plano ${id.toUpperCase()} em desenvolvimento!`)
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-4">
        <Link 
          href="/dashboard/credits"
          onClick={() => trigger('light')}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-xs font-black uppercase tracking-widest">Voltar para Energia IA</span>
        </Link>
        
        <div className="flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tighter text-zinc-900 dark:text-white leading-tight">
            Escolha sua <span className="text-indigo-500">Colheita</span>
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium max-w-md">
            Adquira pacotes de grãos e libere o poder total da Inteligência Artificial em suas compras.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {PLANS.map((plan) => {
          const Icon = plan.icon
          return (
            <div 
              key={plan.id}
              className={`relative glass-panel p-8 rounded-[2.5rem] flex flex-col gap-6 transition-all duration-300 border-2 ${plan.popular ? 'border-indigo-500 shadow-2xl shadow-indigo-500/20 scale-105 z-10' : 'border-transparent hover:border-zinc-200 dark:hover:border-white/10'}`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg flex items-center gap-1.5">
                  <Star className="w-3 h-3 fill-current" /> Recomendado
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className={`w-14 h-14 rounded-2xl ${plan.bgColor} ${plan.color} flex items-center justify-center shadow-inner`}>
                  <Icon className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-zinc-900 dark:text-white">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-black text-indigo-500">{plan.price}</span>
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">/ pacote</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 py-3 px-4 bg-zinc-100 dark:bg-zinc-900/50 rounded-2xl border border-zinc-200 dark:border-white/5">
                <Zap className="w-4 h-4 text-amber-500" />
                <span className="text-xs font-black text-zinc-900 dark:text-white">{plan.grains} Grãos</span>
              </div>

              <ul className="flex-1 space-y-3">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-lg ${plan.popular ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'bg-zinc-900 dark:bg-white text-white dark:text-black hover:opacity-90'}`}
              >
                Colher Agora
              </button>
            </div>
          )
        })}
      </div>

      <div className="mt-8 p-10 rounded-[3rem] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/10 dark:border-indigo-500/5 text-center">
        <div className="flex items-center justify-center gap-3 text-indigo-500 mb-4">
          <Sparkles className="w-6 h-6" />
          <h4 className="font-black uppercase tracking-widest text-xs">Garantia Staff</h4>
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 font-medium max-w-2xl mx-auto leading-relaxed">
          Nossos grãos não expiram. Compre agora e use quando precisar. 
          Ao adquirir um pacote, você ajuda a manter o projeto ativo e livre de anúncios irritantes.
        </p>
      </div>
    </main>
  )
}
