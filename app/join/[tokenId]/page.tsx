"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2, CheckCircle2, XCircle, ShoppingCart } from "lucide-react"

export default function JoinListPage({
  params
}: {
  params: Promise<{ tokenId: string }>
}) {
  const { tokenId } = use(params)
  const router = useRouter()
  const supabase = createClient()
  const [status, setStatus] = useState<
    "loading" | "success" | "error" | "unauthorized"
  >("loading")
  const [listName, setListName] = useState("")

  useEffect(() => {
    async function join() {
      // 1. Verificar se o usuário está logado
      const {
        data: { user }
      } = await supabase.auth.getUser()

      if (!user) {
        // Se não estiver logado, salva o token e vai para a home
        localStorage.setItem("pending_invite_token", tokenId)
        setStatus("unauthorized")
        setTimeout(() => router.push("/"), 3000)
        return
      }

      // 2. Tentar entrar na lista usando a função RPC que criamos
      try {
        const { data: listId, error } = await (supabase.rpc as any)(
          "join_list_via_token",
          {
            token_uuid: tokenId
          }
        )

        if (error) throw error

        // 3. Buscar nome da lista para o feedback visual
        const { data: listData } = await (supabase.from("lists") as any)
          .select("title")
          .eq("id", listId)
          .single()

        setListName(listData?.title || "Lista")
        setStatus("success")

        // Redireciona após 2 segundos de comemoração
        setTimeout(() => router.push(`/app/lists/${listId}`), 2000)
      } catch (err) {
        console.error("Erro ao entrar na lista:", err)
        setStatus("error")
      }
    }

    join()
  }, [tokenId, supabase, router])

  return (
    <main className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-6 text-center">
      <div className="w-24 h-24 rounded-[2rem] bg-[#1c1b1b] border-2 border-[#53E076]/20 flex items-center justify-center mb-8 shadow-2xl shadow-[#53E076]/5">
        <ShoppingCart className="w-10 h-10 text-[#53E076]" />
      </div>

      {status === "loading" && (
        <div className="flex flex-col items-center gap-6">
          <Loader2 className="w-10 h-10 text-[#53E076] animate-spin" />
          <div>
            <h1 className="text-2xl font-black text-[#e5e2e1] mb-2 tracking-tight">
              Validando seu convite
            </h1>
            <p className="text-zinc-500 text-sm font-bold uppercase tracking-widest">Aguarde um momento...</p>
          </div>
        </div>
      )}

      {status === "success" && (
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-[#53E076]/10 flex items-center justify-center border border-[#53E076]/20 shadow-lg shadow-[#53E076]/10">
            <CheckCircle2 className="w-8 h-8 text-[#53E076]" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-[#e5e2e1] mb-2 tracking-tight">Bem-vindo à lista!</h1>
            <p className="text-zinc-500 text-lg">
              Você agora é colaborador da lista{" "}
              <span className="text-[#53E076] font-black">{listName}</span>
            </p>
          </div>
        </div>
      )}

      {status === "error" && (
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/10">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#e5e2e1] mb-2 tracking-tight">Convite Inválido</h1>
            <p className="text-zinc-500 text-sm font-bold leading-relaxed max-w-xs">
              Este link de convite expirou ou já foi utilizado por outra pessoa.
            </p>
          </div>
          <button
            onClick={() => router.push("/app")}
            className="mt-4 px-10 py-4 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
          >
            Voltar para o Início
          </button>
        </div>
      )}

      {status === "unauthorized" && (
        <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#e5e2e1] mb-2 tracking-tight">Quase pronto!</h1>
            <p className="text-zinc-500 text-sm font-bold leading-relaxed max-w-xs">
              Você precisa de uma conta para participar. Redirecionando para
              o cadastro em instantes...
            </p>
          </div>
        </div>
      )}
    </main>
  )
}
