"use client"

import { useEffect, useState } from "react"
import { Smartphone, MonitorOff, ExternalLink } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

/**
 * Componente para bloquear o acesso em telas desktop.
 * PORQUÊ: O Gaga List é um PWA Mobile-First. Telas grandes quebram a experiência
 * pretendida de "lista de bolso".
 */
export function DesktopBlocker() {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const checkScreen = () => {
      // Bloqueia se a tela for maior que 768px (padrão MD do Tailwind)
      setIsDesktop(window.innerWidth > 1024)
    }

    checkScreen()
    window.addEventListener("resize", checkScreen)
    return () => window.removeEventListener("resize", checkScreen)
  }, [])

  if (!isDesktop) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-[9999] bg-[#131313] flex items-center justify-center p-6 text-center"
      >
        <div className="max-w-md w-full flex flex-col items-center gap-8">
          <div className="relative">
            <div className="w-24 h-24 rounded-[2rem] flex items-center justify-center neon-pulse relative" style={{ background: "rgba(83,224,118,0.12)" }}>
              <Smartphone className="w-12 h-12" />
            </div>
            <div className="absolute -top-2 -right-2 w-10 h-10 bg-[#93000a] rounded-full flex items-center justify-center text-[#ffb4ab] border-4 border-[#131313]">
              <MonitorOff className="w-5 h-5" />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-3xl font-black text-[#e5e2e1] tracking-tight leading-tight">
              Experiência de Bolso <br />
              <span className="text-[#53E076]">Apenas Mobile</span>
            </h2>
            <p className="text-[#bccbb9] font-medium leading-relaxed">
              O <span className="text-[#e5e2e1] font-bold">Gaga List</span> foi desenhado para ser usado no mercado, na palma da sua mão.
            </p>
          </div>

          <div className="w-full p-6 bg-[#201f1f] rounded-3xl border border-[#3d4a3d] space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-[#bccbb9]/60">
              Como acessar agora:
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 p-4 bg-[#131313] rounded-2xl text-left border border-[#3d4a3d]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[#53E076] text-xs font-black">1</div>
                <p className="text-sm text-[#e5e2e1] font-bold">Abra este link no seu celular</p>
              </div>
              <div className="flex items-center gap-3 p-4 bg-[#131313] rounded-2xl text-left border border-[#3d4a3d]">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-[#53E076] text-xs font-black">2</div>
                <p className="text-sm text-[#e5e2e1] font-bold">Ou diminua a largura desta janela</p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[#bccbb9]/50 text-[10px] font-black uppercase tracking-widest">
            <Smartphone className="w-3 h-3" /> Mobile First Engine v1.0
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

