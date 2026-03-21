"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { ArrowLeft, Sparkles, Zap, ChefHat, Camera, CreditCard, Clock } from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"

export default function CreditsPage() {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  
  const [credits, setCredits] = useState<number>(0)
  const [logs, setLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        // Fetch credits
        const { data: profile } = await (supabase as any).from('profiles')
          .select('credits')
          .eq('id', user.id)
          .single()
        
        if (profile) setCredits(profile.credits)

        // Fetch logs
        const { data: usageLogs } = await (supabase as any).from('ai_usage_logs')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10)
        
        if (usageLogs) setLogs(usageLogs)
        setIsLoading(false)
      }
      fetchData()
    }
  }, [user, supabase])

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-center gap-4">
        <Link href="/dashboard/profile" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">Energia IA</h1>
          <p className="text-sm text-zinc-500 font-medium">Controle seus Grãos Mágicos</p>
        </div>
      </header>

      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/20">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        <div className="relative z-10 flex flex-col items-center text-center gap-2">
          <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-3xl flex items-center justify-center mb-2 shadow-inner border border-white/30">
            <Sparkles className="w-8 h-8 text-amber-300" />
          </div>
          <h2 className="text-5xl font-black tracking-tighter">{isLoading ? "..." : credits}</h2>
          <p className="text-sm font-bold uppercase tracking-widest text-indigo-100">Grãos Disponíveis</p>
        </div>
      </div>

      {/* Como usar */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Custo das Mágicas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-2 border-transparent hover:border-emerald-500/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><ChefHat className="w-5 h-5" /></div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Gerar Receita</span>
            </div>
            <span className="text-xs font-black text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md">-1 grão</span>
          </div>
          <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-2 border-transparent hover:border-indigo-500/20 transition-all">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><Camera className="w-5 h-5" /></div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Escanear Foto</span>
            </div>
            <span className="text-xs font-black text-indigo-500 bg-indigo-500/10 px-2 py-1 rounded-md">-2 grãos</span>
          </div>
        </div>
      </div>

      {/* Recarga / Monetização */}
      <div className="bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/5 rounded-3xl p-6 flex flex-col items-center text-center gap-4">
        <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mb-2">
          <Zap className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-zinc-900 dark:text-white">Precisa de mais grãos?</h3>
          <p className="text-sm text-zinc-500 mt-1 max-w-[250px] mx-auto">Apoie o projeto e recarregue sua energia para continuar criando.</p>
        </div>
        <button 
          onClick={() => alert("Integração com Apacate Pay / Stripe em breve!")}
          className="mt-2 w-full py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 active:scale-95 transition-all shadow-xl"
        >
          <CreditCard className="w-4 h-4" /> Comprar 500 Grãos (R$ 9,90)
        </button>
      </div>

      {/* Histórico */}
      <div className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 ml-2">Últimos Gastos</h3>
        {isLoading ? (
          <div className="text-center text-sm text-zinc-500 py-4">Carregando...</div>
        ) : logs.length === 0 ? (
          <div className="text-center text-sm text-zinc-500 py-8 bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl border border-dashed border-zinc-200 dark:border-white/5">Você ainda não usou nenhuma mágica.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {logs.map((log) => (
              <div key={log.id} className="flex items-center justify-between p-4 glass-panel rounded-2xl">
                <div className="flex items-center gap-3">
                  {log.feature === 'recipe' ? <ChefHat className="w-4 h-4 text-emerald-500" /> : <Camera className="w-4 h-4 text-indigo-500" />}
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100 capitalize">{log.feature}</span>
                    <span className="text-[9px] text-zinc-400 font-bold flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(log.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                <span className="text-xs font-black text-rose-500 bg-rose-500/10 px-2 py-1 rounded-md">-{log.cost}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
