"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, XCircle, ShoppingCart } from "lucide-react"

export default function JoinListPage({ params }: { params: Promise<{ tokenId: string }> }) {
  const { tokenId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<"loading" | "success" | "error" | "unauthorized">("loading")
  const [listName, setListName] = useState("")

  useEffect(() => {
    async function join() {
      // 1. Verificar se o usuário está logado
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        // Se não estiver logado, salva o token e vai para a home
        localStorage.setItem("pending_invite_token", tokenId)
        setStatus("unauthorized")
        setTimeout(() => router.push("/"), 3000)
        return
      }

      // 2. Tentar entrar na lista usando a função RPC que criamos
      try {
        const { data: listId, error } = await (supabase.rpc as any)("join_list_via_token", {
          token_uuid: tokenId
        })

        if (error) throw error

        // 3. Buscar nome da lista para o feedback visual
        const { data: listData } = await (supabase
          .from("lists") as any)
          .select("title")
          .eq("id", listId)
          .single()

        setListName(listData?.title || "Lista")
        setStatus("success")
        
        // Redireciona após 2 segundos de comemoração
        setTimeout(() => router.push(`/dashboard/lists/${listId}`), 2000)
      } catch (err) {
        console.error("Erro ao entrar na lista:", err)
        setStatus("error")
      }
    }

    join()
  }, [tokenId, supabase, router])

  return (
    <main className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-20 h-20 rounded-3xl bg-indigo-500/10 flex items-center justify-center mb-8">
        <ShoppingCart className="w-10 h-10 text-indigo-400" />
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
          <h1 className="text-xl font-bold text-white">Validando seu convite...</h1>
          <p className="text-zinc-500 text-sm">Quase lá!</p>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bem-vindo à lista!</h1>
          <p className="text-zinc-400">Você agora é colaborador da lista <span className="text-indigo-400 font-bold">{listName}</span>.</p>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
          <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <XCircle className="w-6 h-6 text-red-500" />
          </div>
          <h1 className="text-xl font-bold text-white">Convite Inválido</h1>
          <p className="text-zinc-500 text-sm">Este link de convite expirou ou já foi utilizado.</p>
          <button 
            onClick={() => router.push("/dashboard")}
            className="mt-4 px-6 py-2 bg-zinc-900 text-white rounded-xl font-bold"
          >
            Voltar para o Início
          </button>
        </div>
      )}

      {status === "unauthorized" && (
        <div className="flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300">
          <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          <h1 className="text-xl font-bold text-white">Quase pronto!</h1>
          <p className="text-zinc-500 text-sm max-w-[250px]">
            Você precisa estar logado para entrar na lista. Redirecionando para o cadastro...
          </p>
        </div>
      )}
    </main>
  )
}
