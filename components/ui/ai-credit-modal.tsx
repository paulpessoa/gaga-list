"use client"

import { useAICreditModal } from "@/hooks/use-ai-credit-modal"
import { useHaptic } from "@/hooks/use-haptic"
import { Zap, X, ShoppingBag, ArrowRight, Sparkles } from "lucide-react"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"

export function AICreditModal() {
  const { isOpen, close } = useAICreditModal()
  const { trigger } = useHaptic()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
        {/* Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[3rem] p-10 shadow-2xl border border-zinc-100 dark:border-white/5 overflow-hidden text-center"
        >
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-[50px] -mr-16 -mt-16 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/10 rounded-full blur-[50px] -ml-16 -mb-16 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={close}
            className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Icon Header */}
          <div className="mb-8 relative inline-block">
            <div className="w-20 h-20 bg-indigo-500 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-500/40 relative z-10 mx-auto">
              <Zap className="w-10 h-10 text-white fill-current animate-pulse" />
            </div>
            <Sparkles className="absolute -top-2 -right-2 w-6 h-6 text-amber-400 animate-bounce" />
          </div>

          <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
            Sua Energia IA Acabou!
          </h2>

          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium leading-relaxed mb-10 px-2">
            Você utilizou todos os seus **Grãos Mágicos**. Recarregue para
            continuar usando o Scanner e o Chef IA!
          </p>

          <div className="flex flex-col gap-3">
            <Link
              href="/app/credits"
              onClick={() => {
                trigger("medium")
                close()
              }}
              className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" /> Recarregar Agora
            </Link>

            <button
              onClick={close}
              className="w-full py-4 text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-widest text-[9px] hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
            >
              Talvez depois
            </button>
          </div>

          <div className="mt-8 pt-8 border-t border-zinc-100 dark:border-white/5">
            <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest opacity-60">
              Dica: Convide amigos e ganhe 50 grãos!
            </p>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
