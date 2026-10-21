"use client"

import { PageTransition } from "@/components/ui/motion"
import { AICreditModal } from "@/components/ui/ai-credit-modal"
import { SideNav } from "@/components/navigation/side-nav"

/**
 * Layout da área logada.
 * - Mobile: conteúdo em tela cheia + TabBar flutuante (renderizada no root layout).
 * - md+: SideNav fixa à esquerda; o conteúdo ganha padding para não ficar por baixo.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SideNav />
      <div className="md:pl-20 lg:pl-64">
        <PageTransition>
          {children}
          <AICreditModal />
        </PageTransition>
      </div>
    </>
  )
}
