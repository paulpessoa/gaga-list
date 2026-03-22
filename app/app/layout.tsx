"use client"

import { PageTransition } from "@/components/ui/motion"
import { AICreditModal } from "@/components/ui/ai-credit-modal"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      {children}
      <AICreditModal />
    </PageTransition>
  )
}
