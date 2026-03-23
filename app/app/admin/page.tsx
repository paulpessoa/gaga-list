"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect, useCallback } from "react"
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
  ExternalLink,
  Globe,
  Star,
  Package,
  CheckCircle,
  Settings
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"
import Image from "next/image"
import { MyProductsService, MyProduct } from "@/services/my-products.service"
import { CuratorProductModal } from "@/components/dashboard/curator-product-modal"

// Configuração de custos das APIs
const API_COSTS: Record<string, { model: string; estimated_brl: number }> = {
  recipe: { model: "Gemini 1.5 Flash", estimated_brl: 0.005 },
  ocr: { model: "GPT-4o-mini", estimated_brl: 0.02 },
  vision: { model: "GPT-4o-mini", estimated_brl: 0.03 },
  voice: { model: "Whisper + Gemini", estimated_brl: 0.015 },
  suggestion: { model: "Llama 3.3", estimated_brl: 0.002 }
}

export default function AdminPage() {
  const { data: user } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  const router = useRouter()

  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"finance" | "curation">("finance")
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalGrainsUsed: 0,
    totalRevenue: 0,
    estimatedApiCost: 0
  })
  const [recentLogs, setRecentRecentLogs] = useState<any[]>([])
  const [userProducts, setUserProducts] = useState<MyProduct[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  const [selectedProduct, setSelectedProduct] = useState<MyProduct | null>(null)
  const [isPromoting, setIsPromoting] = useState(false)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    if (!user) return

    try {
      const { count: usersCount } = await (
        supabase.from("profiles") as any
      ).select("*", { count: "exact", head: true })
      const { data: logsData } = await (
        supabase.from("ai_usage_logs") as any
      ).select("feature, cost")

      let grainsUsed = 0
      let apiCost = 0
      let revenue = 0

      logsData?.forEach((log: any) => {
        if (log.cost > 0) {
          grainsUsed += log.cost
          const costInfo = API_COSTS[log.feature]
          if (costInfo) apiCost += costInfo.estimated_brl
        } else {
          revenue += (Math.abs(log.cost) / 500) * 10
        }
      })

      setStats({
        totalUsers: usersCount || 0,
        totalGrainsUsed: grainsUsed,
        totalRevenue: revenue,
        estimatedApiCost: apiCost
      })

      const { data: recent } = await (supabase.from("ai_usage_logs") as any)
        .select("*, profiles(full_name, email)")
        .order("created_at", { ascending: false })
        .limit(20)

      setRecentRecentLogs(recent || [])

      const prods = await MyProductsService.getAllUserProducts(supabase)
      setUserProducts(prods)
    } catch (err) {
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }, [user, supabase])

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
      fetchData()
    }
    checkAdmin()
  }, [user, supabase, router, fetchData])

  const handlePromote = async (updatedProduct: Partial<MyProduct>) => {
    setIsPromoting(true)
    try {
      await MyProductsService.promoteToGlobal(supabase, updatedProduct)
      trigger("success" as any)
      await fetchData()
    } catch (err) {
      alert("Erro ao promover produto.")
    } finally {
      setIsPromoting(false)
      setSelectedProduct(null)
    }
  }

  if (!isAdmin) return null

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6 md:p-12 pb-32">
      <div className="max-w-6xl mx-auto space-y-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Link
              href="/app"
              className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <ShieldAlert className="w-5 h-5 text-red-500" />
                <h1 className="text-2xl font-black uppercase tracking-tighter">
                  Painel Staff
                </h1>
              </div>
              <p className="text-zinc-500 text-sm font-medium">
                Controle financeiro e operacional do ecossistema
              </p>
            </div>
          </div>

          <div className="flex bg-zinc-900 p-1.5 rounded-2xl border border-white/5">
            <button
              onClick={() => {
                setActiveTab("finance")
                trigger("light")
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "finance" ? "bg-white text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-white"}`}
            >
              <DollarSign className="w-4 h-4" /> Financeiro
            </button>
            <button
              onClick={() => {
                setActiveTab("curation")
                trigger("light")
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === "curation" ? "bg-white text-zinc-900 shadow-xl" : "text-zinc-500 hover:text-white"}`}
            >
              <Star className="w-4 h-4" /> Curadoria
            </button>
            <Link
              href="/app/admin/settings"
              onClick={() => trigger("light")}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-zinc-500 hover:text-white transition-all"
            >
              <Settings className="w-4 h-4" /> Configurações
            </Link>
          </div>
        </header>

        {activeTab === "finance" ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Total Usuários
                  </p>
                  <h3 className="text-3xl font-black tracking-tighter">
                    {stats.totalUsers}
                  </h3>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Grãos Consumidos
                  </p>
                  <h3 className="text-3xl font-black tracking-tighter">
                    {stats.totalGrainsUsed}
                  </h3>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Receita Bruta (Est.)
                  </p>
                  <h3 className="text-3xl font-black tracking-tighter text-emerald-400">
                    R${" "}
                    {stats.totalRevenue.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2
                    })}
                  </h3>
                </div>
              </div>

              <div className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem] space-y-4 border-rose-500/20 shadow-lg shadow-rose-500/5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                  <Cpu className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">
                    Custo APIs (Est.)
                  </p>
                  <h3 className="text-3xl font-black tracking-tighter text-rose-400">
                    R${" "}
                    {stats.estimatedApiCost.toLocaleString("pt-BR", {
                      minimumFractionDigits: 2
                    })}
                  </h3>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-zinc-500" />
                  <h2 className="text-lg font-black uppercase tracking-widest">
                    Financeiro e Operações
                  </h2>
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

              <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-white/5">
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Usuário
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Ação / Feature
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Grãos
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Custo API (Est.)
                        </th>
                        <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          Data
                        </th>
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
                          <td
                            colSpan={5}
                            className="px-6 py-12 text-center text-zinc-500 italic"
                          >
                            Nenhuma transação registrada.
                          </td>
                        </tr>
                      ) : (
                        recentLogs.map((log) => {
                          const isRecharge = log.cost < 0
                          const apiCost = !isRecharge
                            ? API_COSTS[log.feature]?.estimated_brl || 0
                            : 0

                          return (
                            <tr
                              key={log.id}
                              className="hover:bg-white/[0.02] transition-colors group"
                            >
                              <td className="px-6 py-4">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">
                                    {log.profiles?.full_name || "Usuário Anon"}
                                  </span>
                                  <span className="text-[10px] text-zinc-500">
                                    {log.profiles?.email}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                  <div
                                    className={`w-2 h-2 rounded-full ${isRecharge ? "bg-emerald-500" : "bg-rose-500"}`}
                                  />
                                  <span className="text-xs font-bold uppercase tracking-widest">
                                    {isRecharge
                                      ? "Recarga via Stripe"
                                      : log.feature}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`text-sm font-black ${isRecharge ? "text-emerald-400" : "text-rose-400"}`}
                                >
                                  {isRecharge ? "+" : ""}
                                  {Math.abs(log.cost)}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className="text-xs font-mono text-zinc-400">
                                  {isRecharge
                                    ? "-"
                                    : `R$ ${apiCost.toFixed(3)}`}
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
          </>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-zinc-500" />
                <h2 className="text-lg font-black uppercase tracking-widest">
                  Curadoria de Novos Produtos
                </h2>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Filtrar por nome..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-zinc-900 border border-white/5 rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-500 outline-none w-full md:w-64"
                />
              </div>
            </div>

            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Produto Sugerido
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Usuário
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Categoria
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                        Data
                      </th>
                      <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-zinc-500 text-right">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {userProducts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-20 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <Package className="w-12 h-12 text-zinc-800" />
                            <p className="text-zinc-500 font-bold uppercase tracking-widest text-[10px]">
                              Nenhum produto pendente para curadoria
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      userProducts
                        .filter((p) =>
                          p.name
                            .toLowerCase()
                            .includes(searchQuery.toLowerCase())
                        )
                        .map((prod: any) => (
                          <tr
                            key={prod.id}
                            className="hover:bg-white/[0.02] transition-colors group"
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center text-lg overflow-hidden border border-white/5 relative">
                                  {prod.image_url ? (
                                    <Image
                                      src={prod.image_url}
                                      alt={prod.name}
                                      fill
                                      className="object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-zinc-600" />
                                  )}
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold">
                                    {prod.name}
                                  </span>
                                  <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-black">
                                    {prod.brand || "Marca Genérica"}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex flex-col">
                                <span className="text-xs font-bold text-zinc-300">
                                  {prod.profiles?.full_name}
                                </span>
                                <span className="text-[9px] text-zinc-500 font-mono">
                                  {prod.profiles?.email}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="px-2 py-0.5 bg-zinc-800 rounded text-[9px] font-black uppercase tracking-widest text-zinc-400">
                                {prod.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-xs text-zinc-500">
                              {new Date(prod.created_at).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                onClick={() => setSelectedProduct(prod)}
                                className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/5"
                              >
                                <Globe className="w-3.5 h-3.5" /> Curar
                              </button>
                            </td>
                          </tr>
                        ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Rodapé de Referência */}
        <div className="bg-indigo-500/5 border border-indigo-500/10 rounded-3xl p-8 mt-12">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-black uppercase tracking-widest text-indigo-400">
              Referência de Margem Staff
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-6">
            {Object.entries(API_COSTS).map(([key, info]) => (
              <div key={key} className="space-y-1">
                <p className="text-[9px] font-black uppercase text-zinc-500">
                  {key}
                </p>
                <p className="text-xs font-bold">{info.model}</p>
                <p className="text-[10px] font-mono text-indigo-400">
                  R$ {info.estimated_brl.toFixed(3)} / req
                </p>
              </div>
            ))}
          </div>
        </div>

        {selectedProduct && (
          <CuratorProductModal
            product={selectedProduct}
            onClose={() => setSelectedProduct(null)}
            onPromote={handlePromote}
            isPromoting={isPromoting}
          />
        )}
      </div>
    </main>
  )
}
