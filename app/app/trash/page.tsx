// app/app/trash/page.tsx
"use client"

import { useTrashLists, useRestoreList } from "@/hooks/use-lists"
import { useHaptic } from "@/hooks/use-haptic"
import { Trash2, RefreshCcw, ArrowLeft, Calendar, Info } from "lucide-react"
import Link from "next/link"

export default function TrashPage() {
  const { data: trashLists, isLoading } = useTrashLists()
  const restoreList = useRestoreList()
  const { trigger } = useHaptic()

  const handleRestore = (listId: string) => {
    trigger("medium")
    restoreList.mutate(listId)
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10 bg-[#131313]">
      <header className="flex flex-col gap-4">
        <Link
          href="/app"
          className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Voltar ao APP
          </span>
        </Link>

        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#e5e2e1]">
            Lixeira
          </h1>
          <p className="text-zinc-500 text-sm">
            Listas aqui serão excluídas permanentemente após 30 dias.
          </p>
        </div>
      </header>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-500 text-sm">
        <Info className="w-5 h-5 shrink-0" />
        <p>
          As listas na lixeira não são visíveis para colaboradores até serem
          restauradas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {isLoading ? (
          [1, 2].map((i) => (
            <div
              key={i}
              className="rounded-3xl p-8 min-h-[140px] animate-pulse bg-[#1c1b1b] border border-[#3d4a3d]/40"
            />
          ))
        ) : trashLists?.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-[#3d4a3d]/60 rounded-[2.5rem]">
            <Trash2 className="w-16 h-16 text-zinc-800" />
            <p className="text-zinc-500 text-center font-medium">
              Sua lixeira está vazia.
            </p>
          </div>
        ) : (
          trashLists?.map((list: any) => {
            const deletedDate = new Date(list.deleted_at)
            const expiryDate = new Date(deletedDate)
            expiryDate.setDate(deletedDate.getDate() + 30)

            return (
              <div
                key={list.id}
                className="rounded-3xl p-7 flex flex-col justify-between min-h-[140px] bg-[#1c1b1b]/60 border border-[#3d4a3d]/30 group transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-[#131313] flex items-center justify-center text-2xl grayscale opacity-30">
                      {list.icon || "🛒"}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-lg text-zinc-600 line-through">
                        {list.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-600 font-black uppercase tracking-widest mt-1">
                        <Calendar className="w-3 h-3" />
                        Expira em {expiryDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(list.id)}
                    disabled={restoreList.isPending}
                    className="p-3 rounded-2xl bg-[#1DB954] text-white shadow-lg shadow-[#53E076]/20 hover:bg-[#1DB954] transition-all active:scale-95 disabled:opacity-50"
                    title="Restaurar Lista"
                  >
                    <RefreshCcw
                      className={`w-5 h-5 ${restoreList.isPending ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>
    </main>
  )
}

