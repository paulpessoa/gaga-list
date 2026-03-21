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
    <main className="min-h-screen p-6 md:p-12 max-w-5xl mx-auto flex flex-col gap-10">
      <header className="flex flex-col gap-4">
        <Link
          href="/app"
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors group w-fit"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-bold uppercase tracking-widest">
            Voltar ao PP
          </span>
        </Link>

        <div className="flex flex-col">
          <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Lixeira
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-sm">
            Listas aqui serão excluídas permanentemente após 30 dias.
          </p>
        </div>
      </header>

      <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 flex gap-3 text-amber-600 dark:text-amber-500 text-sm">
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
              className="glass-panel rounded-3xl p-8 min-h-[140px] animate-pulse"
            />
          ))
        ) : trashLists?.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-4 border-2 border-dashed border-zinc-100 dark:border-zinc-900 rounded-[2.5rem]">
            <Trash2 className="w-16 h-16 text-zinc-100 dark:text-zinc-900" />
            <p className="text-zinc-400 text-center font-medium">
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
                className="glass-panel rounded-3xl p-7 flex flex-col justify-between min-h-[140px] group transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 shrink-0 rounded-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-2xl grayscale opacity-50">
                      {list.icon || "🛒"}
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-bold text-lg text-zinc-400 dark:text-zinc-500 line-through">
                        {list.title}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-black uppercase tracking-widest mt-1">
                        <Calendar className="w-3 h-3" />
                        Expira em {expiryDate.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleRestore(list.id)}
                    disabled={restoreList.isPending}
                    className="p-3 rounded-2xl bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 disabled:opacity-50"
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
