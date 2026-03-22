"use client"

import { useRouter } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { ChevronRight, LayoutGrid } from "lucide-react"

interface ListCardProps {
  list: any
  user: any
  deleteList?: any
  updateList?: any
}

export function ListCard({
  list,
  user,
  deleteList,
  updateList
}: ListCardProps) {
  const router = useRouter()
  const { trigger } = useHaptic()

  const totalItems = list.items?.length || 0
  const completedItems =
    list.items?.filter((i: any) => i.is_purchased).length || 0
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  const isOwner = list.owner_id === user?.id

  return (
    <div
      onClick={() => {
        trigger("light")
        router.push(`/app/lists/${list.id}`)
      }}
      className="glass-panel card-hover rounded-[2.5rem] p-8 flex flex-col justify-between min-h-[200px] cursor-pointer border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900/40 relative overflow-hidden group shadow-sm hover:shadow-xl transition-all duration-500"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col min-w-0">
          <h3 className="font-black text-2xl text-zinc-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors leading-tight tracking-tight">
            {list.title}
          </h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 opacity-80 mt-1 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full ${isOwner ? 'bg-indigo-500' : 'bg-emerald-500'}`} />
            {isOwner ? "Sua Lista" : "Lista Compartilhada"}
          </p>
        </div>
        
        <div className="w-10 h-10 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-inner">
          <LayoutGrid className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-8 relative">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-3 text-zinc-400">
          <div className="flex items-center gap-2">
            <span>Progresso</span>
          </div>
          <span className="text-zinc-900 dark:text-zinc-100">
            {completedItems}/{totalItems} itens
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex-1 h-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-zinc-200/50 dark:border-white/5">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-[0_0_15px_rgba(99,102,241,0.4)] transition-all duration-1000 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="w-12 h-12 rounded-2xl bg-zinc-900 dark:bg-white text-white dark:text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-all duration-300">
            <ChevronRight className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  )
}
