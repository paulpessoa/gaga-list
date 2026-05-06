"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useMemo } from "react"
import {
  ArrowLeft,
  Sparkles,
  Zap,
  ChefHat,
  Camera,
  CreditCard,
  Clock,
  Mic,
  Lightbulb,
  ScanLine,
  History,
  Info,
  Check,
  TrendingUp,
  ChevronRight
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"
import {
  BarChart,
  Bar,
  XAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts"

import { useAICosts } from "@/hooks/use-ai-costs"

const FEATURE_ICONS: Record<string, any> = {
  recipe: ChefHat,
  ocr: ScanLine,
  vision: Camera,
  voice: Mic,
  suggestion: Lightbulb,
  referral_bonus: Sparkles
}

const FEATURE_COLORS: Record<string, string> = {
  recipe: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
  ocr: "text-[#53E076] bg-[#1DB954]/10 border-[#53E076]/20",
  vision: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  voice: "text-rose-500 bg-rose-500/10 border-rose-500/20",
  suggestion: "text-amber-500 bg-amber-500/10 border-amber-500/20",
  referral_bonus: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20"
}

const FEATURE_LABELS: Record<string, string> = {
  recipe: "Receita Gourmet",
  ocr: "Leitura de Foto",
  vision: "Análise de Imagem",
  voice: "Comando de Voz",
  suggestion: "Sugestão Inteligente",
  referral_bonus: "Bônus de Indicação"
}

export default function CreditsPage() {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const { costs } = useAICosts()
  const supabase = createClient()

  const PRICING_DATA = [
    { id: 'recipe', label: 'Receita', cost: costs.cost_recipe, color: 'emerald', icon: ChefHat },
    { id: 'ocr', label: 'Scanner', cost: costs.cost_ocr, color: 'indigo', icon: ScanLine },
    { id: 'vision', label: 'Visão', cost: costs.cost_vision, color: 'blue', icon: Camera },
    { id: 'voice', label: 'Áudio', cost: costs.cost_voice, color: 'rose', icon: Mic },
    { id: 'suggestion', label: 'Dicas', cost: costs.cost_suggestion, color: 'amber', icon: Lightbulb },
  ]

  const [credits, setCredits] = useState<number>(0)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single()

        setCredits(profile?.credits ?? 0)

        const { data: usageLogs } = await supabase
          .from("ai_usage_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(100)

        if (usageLogs) setLogs(usageLogs)
        setIsLoading(false)
      }
      fetchData()
    }
  }, [user, supabase])

  const chartData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - i)
      const label = date.toLocaleDateString("pt-BR", { weekday: "short" }).toUpperCase()
      const dateKey = date.toLocaleDateString("pt-BR")

      const dayTotal = logs
        .filter((log) => {
          if (!log.created_at || Number(log.cost) <= 0) return false
          return new Date(log.created_at).toLocaleDateString("pt-BR") === dateKey
        })
        .reduce((acc, log) => acc + Number(log.cost), 0)

      return { name: label, grains: dayTotal }
    }).reverse()
  }, [logs])

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-[#131313]">
      <header className="flex items-center gap-4">
        <Link
          href="/app/profile"
          onClick={() => trigger("light")}
          className="p-2.5 rounded-xl bg-[#1c1b1b] transition-all text-zinc-500 hover:text-white border border-[#3d4a3d]/60 shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-[#e5e2e1] leading-tight">
            Energia IA
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Gerencie seus Grãos Mágicos
          </p>
        </div>
      </header>

      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-[#53E076]/20 border border-white/10">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-40 h-40 bg-purple-400/20 rounded-full blur-[60px] -ml-10 -mb-10 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-[2rem] flex items-center justify-center mb-4 shadow-inner border border-white/30 animate-float">
            <Sparkles className="w-10 h-10 text-amber-300" />
          </div>
          <h2 className="text-6xl font-black tracking-tighter mb-1">
            {isLoading ? "..." : credits}
          </h2>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-100 opacity-80">
            Grãos Disponíveis
          </p>
        </div>
      </div>

      {/* Seção de Recarga e Valores (Carousel Ribbon) */}
      <div className="flex flex-col gap-6">
        <div className="bg-[#1c1b1b] rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-6 shadow-xl relative overflow-hidden group border border-[#3d4a3d]/30">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:rotate-12 transition-transform duration-500">
            <Zap className="w-24 h-24 text-white" />
          </div>
          
          <div className="relative z-10">
            <h3 className="text-lg font-black text-white mb-1">Precisa de mais Grãos?</h3>
            <p className="text-xs font-medium text-zinc-500 px-4 leading-tight">Libere o potencial máximo do seu Assistente IA.</p>
          </div>

          <Link
            href="/app/plans"
            onClick={() => trigger("medium")}
            className="relative z-10 w-full py-5 bg-[#1DB954] hover:bg-[#1DB954] text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-[#53E076]/20"
          >
            <CreditCard className="w-4 h-4" /> Recarregar Agora
          </Link>
        </div>

        {/* Ribbon Horizontal de Preços (STAFF UX) */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-2 ml-2">
            <Info className="w-3.5 h-3.5 text-zinc-400" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Valores de Consumo
            </h3>
          </div>
          <div className="flex items-center gap-3 overflow-x-auto pb-4 scrollbar-hide -mx-6 px-6 snap-x">
            {PRICING_DATA.map((item) => (
              <div key={item.id} className="snap-start flex-shrink-0 w-32 p-4 rounded-3xl flex flex-col items-center text-center gap-3 border border-[#3d4a3d]/40 bg-[#1c1b1b] shadow-sm">
                <div className={`w-10 h-10 rounded-2xl bg-[#201f1f] flex items-center justify-center`}>
                  <item.icon className={`w-5 h-5 ${FEATURE_COLORS[item.id].split(' ')[0]}`} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="font-black text-[#e5e2e1] text-[10px] uppercase tracking-tighter">{item.label}</span>
                  <span className="text-[9px] font-black text-zinc-500 uppercase">{item.cost} Grão{item.cost > 1 ? 's' : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Gráfico Recharts */}
      <section className="p-8 rounded-[2.5rem] bg-[#1c1b1b] border border-[#3d4a3d]/50 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#53E076]" />
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Consumo Semanal</h3>
          </div>
          <span className="text-[9px] font-black text-zinc-500 bg-[#201f1f] px-2 py-1 rounded-md">Grãos Usados</span>
        </div>

        <div className="h-48 w-full -ml-6">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#131313] p-2 px-3 rounded-xl shadow-2xl border border-[#3d4a3d]/50">
                        <p className="text-[10px] font-black text-[#e5e2e1] uppercase tracking-widest">
                          {payload[0].value} Grãos
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="grains" radius={[6, 6, 6, 6]} barSize={12}>
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.grains > 0 ? '#6366f1' : '#3d4a3d30'} 
                  />
                ))}
              </Bar>
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 8, fontWeight: 900, fill: '#52525b' }} 
                dy={10}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Histórico com Scroll */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 ml-2">
          <History className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Histórico de Uso
          </h3>
        </div>

        {isLoading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-[#1c1b1b] rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-[#1c1b1b]/20 rounded-[2.5rem] border border-dashed border-[#3d4a3d]/60">
            <Sparkles className="w-8 h-8 text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm font-medium">Você ainda não usou grãos mágicos.</p>
          </div>
        ) : (
          <div className="max-h-[400px] overflow-y-auto pr-2 custom-scrollbar flex flex-col gap-3 pb-4">
            {logs.map((log) => {
              const Icon = FEATURE_ICONS[log.feature] || Zap
              const label = FEATURE_LABELS[log.feature] || log.feature
              const colorClass = FEATURE_COLORS[log.feature] || "text-[#53E076] bg-[#1DB954]/10 border-[#53E076]/20"

              return (
                <div key={log.id} className="flex items-center justify-between p-5 rounded-[2rem] bg-[#1c1b1b]/60 border border-[#3d4a3d]/30 hover:border-[#53E076]/20 transition-all shrink-0 shadow-sm">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${colorClass.split(' border')[0]}`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-[#e5e2e1] capitalize">{label}</span>
                      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(log.created_at).toLocaleDateString()} às {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${log.cost < 0 ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-rose-500/5 border border-rose-500/10"}`}>
                    <span className={`text-xs font-black ${log.cost < 0 ? "text-emerald-500" : "text-rose-500"}`}>{Math.abs(log.cost)}</span>
                    <Sparkles className={`w-3 h-3 ${log.cost < 0 ? "text-emerald-400" : "text-rose-400"}`} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </main>
  )
}

