"use client"

import { usePathname, useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { TabBar } from "./ui/tab-bar"
import { VisionScanner } from "./ui/vision-scanner"
import { ScannedProductModal } from "./lists/scanned-product-modal"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { MyProductsService } from "@/services/my-products.service"
import { useHaptic } from "@/hooks/use-haptic"
import { useLists } from "@/hooks/use-lists"

export function NavigationWrapper() {
  const pathname = usePathname()
  const router = useRouter()
  const { data: user } = useUser()
  const { data: lists } = useLists()
  const { trigger } = useHaptic()
  const supabase = createClient()

  const [isScannerOpen, setIsScannerOpen] = useState(false)
  const [scannedData, setScannedData] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const listId = pathname.startsWith("/app/lists/")
    ? pathname.split("/")[3]
    : null

  const handleScanSuccess = (result: any) => {
    setIsScannerOpen(false)
    // result.data vem da OpenAI no modo product
    setScannedData(result.data || result)
  }

  const handleSaveToMyProducts = async (finalData: any) => {
    if (!user || !finalData) return
    setIsSaving(true)
    try {
      await MyProductsService.addProduct(supabase, {
        user_id: user.id,
        name: finalData.name,
        brand: finalData.brand,
        category: finalData.category,
        metadata: {
          benefits: finalData.benefits,
          suggested_uses: finalData.suggested_uses
        } as any
      })
      trigger("success" as any)
      setScannedData(null)
    } catch (err) {
      console.error(err)
      alert("Erro ao salvar produto.")
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddToList = async (targetListId: string, finalData: any) => {
    if (!finalData || !targetListId) return

    setIsSaving(true)
    try {
      await fetch(`/api/lists/${targetListId}/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: finalData.name,
          category: finalData.category,
          quantity: "1"
        })
      })
      trigger("success" as any)
      setScannedData(null)
      if (listId === targetListId) {
        window.location.reload()
      } else {
        router.push(`/app/lists/${targetListId}`)
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao adicionar à lista.")
    } finally {
      setIsSaving(false)
    }
  }

  const hideOnPaths = ["/", "/login", "/api/auth/confirm"]
  const shouldHide = hideOnPaths.includes(pathname)

  if (shouldHide) return null

  // Contextual Button Logic
  let actionButton = undefined
  if (pathname === "/app") {
    actionButton = {
      label: "Nova Lista",
      onClick: () => window.dispatchEvent(new CustomEvent("open-create-list"))
    }
  } else if (listId) {
    actionButton = {
      label: "Novo Item",
      onClick: () => window.dispatchEvent(new CustomEvent("open-create-item"))
    }
  }

  return (
    <>
      <TabBar 
        onScanClick={() => setIsScannerOpen(true)} 
        actionButton={actionButton}
      />

      <VisionScanner
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />

      <ScannedProductModal
        data={scannedData}
        lists={lists || []}
        activeListId={listId}
        onClose={() => setScannedData(null)}
        onSaveToMyProducts={handleSaveToMyProducts}
        onAddToList={handleAddToList}
        isSaving={isSaving}
      />
    </>
  )
}
