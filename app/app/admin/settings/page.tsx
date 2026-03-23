"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { 
  ShieldAlert, 
  ArrowLeft, 
  Settings, 
  Save, 
  Loader2, 
  Zap, 
  Users, 
  ChefHat, 
  Scan, 
  Eye, 
  Mic, 
  Lightbulb, 
  Gift
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"
import { SettingsService, DEFAULT_AI_COSTS } from "@/services/settings.service"

export default function AdminSettingsPage() {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [costs, setCosts] = useState(DEFAULT_AI_COSTS)

  useEffect(() => {
    async function checkAdmin() {
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
      
      const currentCosts = await SettingsService.getAICosts(supabase)
      setCosts(currentCosts)
      setIsLoading(false)
    }
    checkAdmin()
  }, [user, supabase, router])

  const handleSave = async () => {
    setIsSaving(true)
    trigger("medium")
    try {
      await SettingsService.updateAllSettings(supabase, costs)
      trigger("success")
      alert("Configurações salvas com sucesso!")
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar configurações. Verifique o console.")
    } finally {
      setIsSaving(false)
    }
  }

  if (!isAdmin || isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )
  }

  const costItems = [
    { key: "cost_recipe", label: "Custo Receita", icon: ChefHat, color: "text-orange-500", desc: "Grãos por geração de 3 receitas" },
    { key: "cost_ocr", label: "Custo OCR (Lista)", icon: Scan, color: "text-blue-500", desc: "Grãos por extração de foto de lista" },
    { key: "cost_vision", label: "Custo Vision (Produto)", icon: Eye, color: "text-emerald-500", desc: "Grãos por identificação de produto único" },
    { key: "cost_voice", label: "Custo Voz", icon: Mic, color: "text-purple-500", desc: "Grãos por comando de voz processado" },
    { key: "cost_suggestion", label: "Custo Sugestão", icon: Lightbulb, color: "text-amber-500", desc: "Grãos por benefícios e sugestões de IA" },
    { key: "referral_bonus", label: "Bônus de Indicação", icon: Gift, color: "text-rose-500", desc: "Grãos dados a quem indica um amigo" },
  ]

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 pb-32">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/app/admin"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Settings className="w-5 h-5 text-indigo-500" />
                <h1 className="text-2xl font-black uppercase tracking-tighter">
                  Configurações do Sistema
                </h1>
              </div>
              <p className="text-zinc-500 text-sm font-medium">
                Gerencie custos de IA e valores globais
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-all text-sm font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Salvar
          </button>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {costItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.key} className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${item.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <input 
                      type="number"
                      value={costs[item.key as keyof typeof costs]}
                      onChange={(e) => setCosts({ ...costs, [item.key]: Number(e.target.value) })}
                      className="w-20 bg-zinc-800 border border-white/10 rounded-lg px-3 py-1.5 text-center font-black text-lg focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm uppercase tracking-widest">{item.label}</h3>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">{item.desc}</p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="bg-rose-500/5 border border-rose-500/10 rounded-3xl p-6">
          <div className="flex items-center gap-2 mb-2 text-rose-500">
            <ShieldAlert className="w-5 h-5" />
            <h3 className="font-black uppercase tracking-widest text-xs">Zona de Perigo</h3>
          </div>
          <p className="text-zinc-500 text-xs font-medium">
            Alterar esses valores afeta imediatamente todos os usuários. Certifique-se de que a margem de lucro em relação às APIs do Stripe e OpenAI/Gemini permaneça saudável.
          </p>
        </div>
      </div>
    </main>
  )
}
