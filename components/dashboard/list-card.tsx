"use client"

import { useRouter } from "next/navigation"
import { useHaptic } from "@/hooks/use-haptic"
import { Trash2, LogOut, Check, X, Loader2, GripVertical } from "lucide-react"
import { useState } from "react"
import { useLeaveList } from "@/hooks/use-lists"

interface ListCardProps {
  list: any
  user: any
  deleteList?: any
  updateList?: any
  showDragHandle?: boolean
}

export function ListCard({
  list,
  user,
  deleteList,
  updateList,
  showDragHandle
}: ListCardProps) {
  const router = useRouter()
  const { trigger } = useHaptic()
  const leaveList = useLeaveList(list.id)

  const [isConfirming, setIsConfirming] = useState(false)

  const totalItems = list.items?.length || 0
  const completedItems =
    list.items?.filter((i: any) => i.is_purchased).length || 0
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0
  const isOwner = list.owner_id === user?.id

  const handleAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    trigger("medium")
    setIsConfirming(true)
  }

  const cancelAction = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsConfirming(false)
  }

  const confirmAction = async (e: React.MouseEvent) => {
    e.stopPropagation()
    trigger("success")
    if (isOwner) {
      deleteList.mutate(list.id)
    } else {
      leaveList.mutate(user.id)
    }
  }

  const isPending = deleteList?.isPending || leaveList.isPending

  return (
    <div
      onClick={() => {
        if (isConfirming) return
        trigger("light")
        router.push(`/app/lists/${list.id}`)
      }}
      className="card-hover rounded-[2rem] p-6 flex flex-col justify-between min-h-[160px] cursor-pointer relative overflow-hidden group transition-all duration-300" style={{ background: `var(--color-surface-container)`, border: `1px solid var(--color-outline)` }}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          {showDragHandle && (
            <div className="p-1 text-zinc-300 dark:text-zinc-700 cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4" />
            </div>
          )}
          <div className="flex flex-col min-w-0">
            <h3 className="font-black text-xl text-[#e5e2e1] truncate group-hover:text-[#53E076] transition-colors leading-tight tracking-tight">
              {list.title}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <div
                className={`w-1.5 h-1.5 rounded-full ${isOwner ? "bg-[#53E076]" : "bg-emerald-500"}`}
              />
              <p className="text-[9px] font-black uppercase tracking-widest text-[#bccbb9]/60 opacity-80">
                {isOwner ? "Sua Lista" : "Lista Compartilhada"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConfirming ? (
            <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
              <button
                onClick={confirmAction}
                disabled={isPending}
                className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/20 active:scale-95 transition-all"
              >
                {isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={cancelAction}
                className="w-9 h-9 rounded-xl bg-[#201f1f] border border-[#3d4a3d] text-[#bccbb9] flex items-center justify-center active:scale-95 transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleAction}
              className="w-9 h-9 rounded-xl bg-[#201f1f] border border-[#3d4a3d] text-[#bccbb9]/50 hover:text-[#ffb4ab] hover:border-[#ffb4ab]/30 flex items-center justify-center transition-all opacity-0 group-hover:opacity-100"
              title={isOwner ? "Apagar Lista" : "Sair da Lista"}
            >
              {isOwner ? (
                <Trash2 className="w-4 h-4" />
              ) : (
                <LogOut className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 relative">
        <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-widest mb-2.5 text-[#bccbb9]/60">
          <div className="flex items-center gap-2">
            <span>Progresso</span>
          </div>
          <span className="text-[#e5e2e1] font-bold">
            {completedItems}/{totalItems} itens
          </span>
        </div>

        <div className="h-2.5 bg-[#201f1f] rounded-full overflow-hidden shadow-inner border border-[#3d4a3d]">
          <div
            className="h-full bg-gradient-to-r from-[#53E076] to-[#00E5FF] shadow-[0_0_10px_rgba(83,224,118,0.3)] transition-all duration-1000 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  )
}

