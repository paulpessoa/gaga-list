"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldAlert, 
  Users, 
  CreditCard, 
  ArrowLeft,
  Loader2,
  TrendingUp,
  History,
  Zap,
  DollarSign,
  Cpu,
  RefreshCw,
  Search,
  ChevronRight,
  ExternalLink
} from "lucide-react"
import Link from "next/link"

// Configuração de custos das APIs (Staff Insight: Monitoramento de margem)
const API_COSTS: Record<string, { model: string; estimated_brl: number }> = {
  recipe: { model: 'Gemini 1.5 Flash', estimated_brl: 0.005 }, // Quase zero
  ocr: { model: 'GPT-4o-mini', estimated_brl: 0.02 },
  vision: { model: 'GPT-4o-mini', estimated_brl: 0.03 },
  voice: { model: 'Whisper + Gemini', estimated_brl: 0.015 },
  suggestion: { model: 'Llama 3.3', estimated_brl: 0.002 }
}

export default function AdminPage() {
  const { data: user } = useUser()
  const supabase = createClient()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGrainsUsed: 0,
    totalRevenue: 0,
    estimatedApiCost: 0
  })
  const [recentLogs, setRecentRecentLogs] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function checkAdminAndFetch() {
      if (!user) return

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", user.id)
        .single()
      
      if (!profile?.is_admin) {
        router.push("/app")
        return
      }

      setIsAdmin(true)

      // Buscar Estatísticas
      const { count: usersCount } = await (supabase.from("profiles") as any).select("*", { count: 'exact', head: true })
      const { data: logsData } = await (supabase.from("ai_usage_logs") as any).select("feature, cost")
      
      let grainsUsed = 0
      let apiCost = 0
      let revenue = 0

      logsData?.forEach((log: any) => {
        if (log.cost > 0) {
          grainsUsed += log.cost
          const costInfo = API_COSTS[log.feature]
          if (costInfo) apiCost += costInfo.estimated_brl
        } else {
          // Recarga (custo negativo no log)
          // Estimativa simples baseada nos planos (R$ 10 por 500 grãos aprox)
          revenue += (Math.abs(log.cost) / 500) * 10 
        }
      })

      setStats({
        totalUsers: usersCount || 0,
        totalGrainsUsed: grainsUsed,
        totalRevenue: revenue,
        estimatedApiCost: apiCost
      })

      // Buscar Logs Recentes com Perfil
      const { data: recent } = await (supabase.from("ai_usage_logs") as any)
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(20)

      setRecentRecentLogs(recent || [])
      setIsLoading(false)
    }

    checkAdminAndFetch()
  }, [user, supabase, router])

  if (!isAdmin) return null

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link href="/app" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h1 className="text-2xl font-black uppercase tracking-tighter">Painel Staff</h1>
              </div>
              <p className="text-zinc-500 text-sm font-medium">Controle financeiro e operacional do ecossistema</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <button onClick={() => window.location.reload()} className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
               <RefreshCw className="w-4 h-4" /> Atualizar Dados
             </button>
             <a href="https://dashboard.stripe.com/" target="_blank" rel="noreferrer" className="p-3 rounded-xl bg-zinc-900 border border-white/5 hover:border-white/20 transition-all flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
               <ExternalLink className="w-4 h-4" /> Abrir Stripe
             </a>
          </div>
        </header>

        {/* Métricas Financeiras */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Total Usuários</p>
              <h3 className="text-3xl font-black tracking-tighter">{stats.totalUsers}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Grãos Consumidos</p>
              <h3 className="text-3xl font-black tracking-tighter">{stats.totalGrainsUsed}</h3>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 border-emerald-500/20 shadow-lg shadow-emerald-500/5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Receita Bruta (Est.)</p>
              <h3 className="text-3xl font-black tracking-tighter text-emerald-400">
                R$ {stats.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 border-rose-500/20 shadow-lg shadow-rose-500/5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Custo APIs (Est.)</p>
              <h3 className="text-3xl font-black tracking-tighter text-rose-400">
                R$ {stats.estimatedApiCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>
        </div>

        {/* Financeiro e Logs */}
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-zinc-500" />
              <h2 className="text-lg font-black uppercase tracking-widest">Financeiro e Operações</h2>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
              <input 
                type="text"
                placeholder="Buscar usuário ou plano..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-zinc-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-indigo-500 outline-none w-full md:w-64"
              />
            </div>
          </div>

          <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-white/5">
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Usuário</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Ação / Feature</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Grãos</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Custo API (Est.)</th>
                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {isLoading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center">
                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" />
                      </td>
                    </tr>
                  ) : recentLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-zinc-500 italic">
                        Nenhuma transação registrada.
                      </td>
                    </tr>
                  ) : (
                    recentLogs.map((log) => {
                      const isRecharge = log.cost < 0
                      const apiCost = !isRecharge ? (API_COSTS[log.feature]?.estimated_brl || 0) : 0

                      return (
                        <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{log.profiles?.full_name || 'Usuário Anon'}</span>
                              <span className="text-[10px] text-zinc-500">{log.profiles?.email}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={`w-2 h-2 rounded-full ${isRecharge ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                              <span className="text-xs font-bold uppercase tracking-widest">
                                {isRecharge ? 'Recarga via Stripe' : log.feature}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-sm font-black ${isRecharge ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {isRecharge ? '+' : ''}{Math.abs(log.cost)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-mono text-zinc-400">
                              {isRecharge ? '-' : `R$ ${apiCost.toFixed(3)}`}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs text-zinc-500 font-medium">
                            {new Date(log.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Tabela de Preços Referência */}
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8">
           <div className="flex items-center gap-2 mb-6">
             <TrendingUp className="w-5 h-5 text-indigo-400" />
             <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">Referência de Margem Staff</h3>
           </div>
           <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
              {Object.entries(API_COSTS).map(([key, info]) => (
                <div key={key} className="space-y-1">
                  <p className="text-[9px] font-black uppercase text-zinc-500">{key}</p>
                  <p className="text-xs font-bold">{info.model}</p>
                  <p className="text-[10px] font-mono text-indigo-400">R$ {info.estimated_brl.toFixed(3)} / req</p>
                </div>
              ))}
           </div>
        </div>

      </div>
    </main>
  )
}
