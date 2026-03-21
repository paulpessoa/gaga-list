"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldAlert, 
  Activity, 
  Users, 
  Sparkles, 
  ArrowLeft,
  BarChart3,
  BrainCircuit
} from "lucide-react"
import Link from "next/link"

export default function AdminDashboard() {
  const { data: user, isLoading: isUserLoading } = useUser()
  const router = useRouter()
  const supabase = createClient()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalLogs: 0,
    totalCreditsSpent: 0,
    featuresCount: { recipe: 0, ocr: 0, vision: 0 }
  })
  const [recentLogs, setRecentLogs] = useState<any[]>([])

  useEffect(() => {
    const verifyAdminAndFetchData = async () => {
      if (isUserLoading) return
      
      if (!user) {
        router.push("/")
        return
      }

      // 1. Verificar se é admin
      const { data: profile } = await supabase.from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single()
      
      if (!profile?.is_admin) {
        router.push("/app")
        return
      }

      setIsAdmin(true)

      // 2. Buscar Métricas (Em um app de produção, isso viria de uma RPC no banco para otimização)
      const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true })
      const { data: logsData } = await supabase.from('ai_usage_logs').select('feature, cost')
      
      let totalSpent = 0
      const counts = { recipe: 0, ocr: 0, vision: 0 }
      
      logsData?.forEach((log: any) => {
        totalSpent += log.cost
        if (counts[log.feature as keyof typeof counts] !== undefined) {
          counts[log.feature as keyof typeof counts]++
        }
      })

      setStats({
        totalUsers: usersCount || 0,
        totalLogs: logsData?.length || 0,
        totalCreditsSpent: totalSpent,
        featuresCount: counts
      })

      // 3. Buscar logs recentes detalhados
      const { data: recent } = await supabase.from('ai_usage_logs')
        .select('*, profiles(full_name, email)')
        .order('created_at', { ascending: false })
        .limit(10)
      
      if (recent) setRecentLogs(recent)

      setIsVerifying(false)
    }

    verifyAdminAndFetchData()
  }, [user, isUserLoading, router, supabase])

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <ShieldAlert className="w-12 h-12 text-zinc-800 animate-pulse" />
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Acesso Restrito...</p>
      </div>
    )
  }

  if (!isAdmin) return null

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 pb-32">
      <div className="max-w-5xl mx-auto space-y-8">
        <header className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex items-center gap-4">
            <Link href="/app" className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-orange-500">
                Staff Backoffice
              </h1>
              <p className="text-zinc-400 text-sm font-medium flex items-center gap-2 mt-1">
                <Activity className="w-4 h-4 text-emerald-500" /> Sistema Operacional e Monitorado
              </p>
            </div>
          </div>
          <div className="px-4 py-2 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-[10px] font-black uppercase tracking-widest">
            Acesso Root
          </div>
        </header>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-zinc-400">
              <Users className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-widest">Usuários Totais</span>
            </div>
            <div className="text-5xl font-black">{stats.totalUsers}</div>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-zinc-400">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Grãos Queimados</span>
            </div>
            <div className="text-5xl font-black text-amber-500">{stats.totalCreditsSpent}</div>
            <p className="text-[10px] text-zinc-500 uppercase font-bold">Consumo de IA Global</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-6 flex flex-col gap-4">
            <div className="flex items-center gap-3 text-zinc-400">
              <BrainCircuit className="w-5 h-5 text-indigo-500" />
              <span className="text-xs font-bold uppercase tracking-widest">Requisições IA</span>
            </div>
            <div className="text-5xl font-black text-indigo-400">{stats.totalLogs}</div>
            <div className="flex gap-2 text-[10px] uppercase font-bold mt-2">
              <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">Receitas: {stats.featuresCount.recipe}</span>
              <span className="bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">OCR: {stats.featuresCount.ocr}</span>
            </div>
          </div>
        </div>

        {/* Logs Recentes */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <BarChart3 className="w-5 h-5 text-zinc-400" />
            <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400">Tempo Real: Logs de IA</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] uppercase tracking-widest text-zinc-500">
                  <th className="pb-4 font-black">Data/Hora</th>
                  <th className="pb-4 font-black">Usuário</th>
                  <th className="pb-4 font-black">Recurso</th>
                  <th className="pb-4 font-black">Custo</th>
                </tr>
              </thead>
              <tbody className="text-sm">
                {recentLogs.length === 0 ? (
                  <tr><td colSpan={4} className="py-8 text-center text-zinc-600">Nenhum log encontrado.</td></tr>
                ) : (
                  recentLogs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="py-4 text-zinc-400">
                        {new Date(log.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="py-4 font-bold text-zinc-300">
                        {log.profiles?.full_name || log.profiles?.email?.split('@')[0] || 'Desconhecido'}
                      </td>
                      <td className="py-4">
                        <span className="px-2 py-1 bg-zinc-800 rounded-md text-xs font-bold uppercase tracking-wider text-zinc-300">
                          {log.feature}
                        </span>
                      </td>
                      <td className="py-4 font-black text-amber-500">
                        -{log.cost}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </main>
  )
}

