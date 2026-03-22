"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
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
  Info
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"

const FEATURE_ICONS: Record<string, any> = {
  recipe: ChefHat,
  ocr: ScanLine,
  vision: Camera,
  voice: Mic,
  suggestion: Lightbulb
}

const FEATURE_LABELS: Record<string, string> = {
  recipe: "Receita Gourmet",
  ocr: "Leitura de Foto",
  vision: "Análise de Imagem",
  voice: "Comando de Voz",
  suggestion: "Sugestão Inteligente"
}

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
        const { data: profile } = await supabase
          .from("profiles")
          .select("credits")
          .eq("id", user.id)
          .single()

        setCredits(profile?.credits ?? 0)

        // Fetch logs
        const { data: usageLogs } = await supabase
          .from("ai_usage_logs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20)

        if (usageLogs) setLogs(usageLogs)
        setIsLoading(false)
      }
      fetchData()
    }
  }, [user, supabase])

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-center gap-4">
        <Link
          href="/app/profile"
          onClick={() => trigger("light")}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Energia IA
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Gerencie seus Grãos Mágicos
          </p>
        </div>
      </header>

      {/* Saldo Principal */}
      <div className="bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-indigo-500/30 border border-white/10">
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

      {/* Como usar */}
      <div className="space-y-5">
        <div className="flex items-center gap-2 ml-2">
          <Info className="w-3.5 h-3.5 text-zinc-400" />
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Tabela de Consumo
          </h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-2 border-transparent hover:border-emerald-500/20 transition-all bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <ChefHat className="w-5 h-5" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                Gerar Receita
              </span>
            </div>
            <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/10">
              1 grão
            </span>
          </div>
          <div className="glass-panel p-5 rounded-3xl flex items-center justify-between border-2 border-transparent hover:border-indigo-500/20 transition-all bg-zinc-50/50 dark:bg-zinc-900/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <span className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">
                Scanner IA
              </span>
            </div>
            <span className="text-[10px] font-black text-indigo-500 bg-indigo-500/10 px-2.5 py-1.5 rounded-lg border border-indigo-500/10">
              2 grãos
            </span>
          </div>
        </div>
      </div>

      {/* Recarga / Monetização */}
      <div className="bg-zinc-900 dark:bg-white rounded-[2.5rem] p-8 flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
          <Zap className="w-20 h-20 text-white dark:text-zinc-900" />
        </div>

        <div className="relative z-10">
          <h3 className="text-xl font-black text-white dark:text-zinc-900">
            Sua energia acabou?
          </h3>
          <p className="text-sm text-zinc-400 dark:text-zinc-500 mt-2 max-w-[280px] mx-auto font-medium">
            Apoie o projeto e garanta grãos ilimitados para suas criações
            culinárias.
          </p>
        </div>

        <Link
          href="/app/plans"
          onClick={() => trigger("medium")}
          className="relative z-10 w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
        >
          <CreditCard className="w-4 h-4" /> Comprar Grãos
        </Link>
      </div>

      {/* Histórico */}
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
              <div
                key={i}
                className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-3xl animate-pulse"
              />
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16 bg-zinc-50 dark:bg-zinc-900/20 rounded-[2.5rem] border border-dashed border-zinc-200 dark:border-white/5">
            <Sparkles className="w-8 h-8 text-zinc-200 dark:text-zinc-800 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm font-medium">
              Você ainda não usou grãos mágicos.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {logs.map((log) => {
              const Icon = FEATURE_ICONS[log.feature] || Zap
              const label = FEATURE_LABELS[log.feature] || log.feature

              return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-5 glass-panel rounded-[2rem] bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 hover:border-indigo-500/20 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 flex items-center justify-center shadow-sm">
                      <Icon className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100 capitalize">
                        {label}
                      </span>
                      <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {new Date(log.created_at).toLocaleDateString()} às{" "}
                        {new Date(log.created_at).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${log.cost < 0 ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-rose-500/5 border border-rose-500/10'}`}>
                    <span className={`text-xs font-black ${log.cost < 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {Math.abs(log.cost)}
                    </span>
                    <Sparkles className={`w-3 h-3 ${log.cost < 0 ? 'text-emerald-400' : 'text-rose-400'}`} />
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
