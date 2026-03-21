"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { Edit2, Trash2, ChevronRight } from "lucide-react"

interface ListCardProps {
  list: any
  user: any
  deleteList: any
  updateList: any
}

export function ListCard({ list, user, deleteList, updateList }: ListCardProps) {
  const router = useRouter()
  const { trigger } = useHaptic()
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(list.title)

  const totalItems = list.items?.length || 0
  const completedItems = list.items?.filter((i: any) => i.is_purchased).length || 0
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  const isOwner = list.owner_id === user?.id

  const submitRename = () => {
    if (!editTitle.trim()) {
      setIsEditing(false)
      return
    }
    updateList.mutate(
      { listId: list.id, updates: { title: editTitle } },
      { onSuccess: () => setIsEditing(false) }
    )
  }

  return (
    <div
      onClick={() => {
        trigger("light")
        router.push(`/dashboard/lists/${list.id}`)
      }}
      className="glass-panel card-hover rounded-[2rem] p-6 flex flex-col justify-between min-h-[200px] cursor-pointer border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900/40 relative overflow-hidden group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4 overflow-hidden">
          <div className="w-12 h-12 shrink-0 rounded-2xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-2xl shadow-inner border border-indigo-500/10">
            {list.icon || "🛒"}
          </div>
          <div className="flex flex-col min-w-0">
            {isEditing ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={submitRename}
                onKeyDown={(e) => e.key === "Enter" && submitRename()}
                onClick={(e) => e.stopPropagation()}
                className="bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white font-bold text-lg rounded px-2 py-0.5 outline-none ring-2 ring-indigo-500"
              />
            ) : (
              <h3 className="font-black text-lg text-zinc-900 dark:text-white truncate group-hover:text-indigo-500 transition-colors leading-tight">
                {list.title}
              </h3>
            )}
            <div className="flex items-center gap-2 mt-0.5">
              <span
                className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${isOwner ? "bg-indigo-500/10 text-indigo-600" : "bg-amber-500/10 text-amber-600"}`}
              >
                {isOwner ? "Proprietário" : "Colaborador"}
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-4">
        <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest mb-2 text-zinc-400">
          <span>Progresso</span>
          <span className="text-zinc-900 dark:text-zinc-100">
            {completedItems}/{totalItems} itens
          </span>
        </div>
        <div className="w-full h-2.5 bg-zinc-100 dark:bg-zinc-800/50 rounded-full overflow-hidden shadow-inner border border-zinc-200/50 dark:border-white/5">
          <div
            className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)] transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsEditing(true)
            }}
            className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          {isOwner && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                if (confirm("Mover para a lixeira?")) deleteList.mutate(list.id)
              }}
              className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 text-zinc-500 hover:text-red-500 hover:bg-white dark:hover:bg-zinc-700 transition-all border border-transparent hover:border-zinc-200 dark:hover:border-white/10"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
          Acessar <ChevronRight className="w-3 h-3 ml-1" />
        </div>
      </div>
    </div>
  )
}
