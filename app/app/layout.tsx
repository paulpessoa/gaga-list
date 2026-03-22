"use client"

import { PageTransition } from "@/components/ui/motion"

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <PageTransition>
      {children}
    </PageTransition>
  )
}
