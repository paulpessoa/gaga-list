"use client"

import { useEffect, useMemo, useState } from "react"
import { Loader2, Package, Search } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { MyProductsService, MyProduct } from "@/services/my-products.service"
import { CuratorProductModal } from "@/components/dashboard/curator-product-modal"
import { PageHeader, Card, EmptyState, fmtDate } from "@/components/admin/admin-ui"

type ProductWithOwner = MyProduct & { profiles?: { full_name: string | null; email: string } | null }

/**
 * Curadoria: produtos cadastrados por usuários que podem virar catálogo global
 * (o autocomplete de todo mundo). Migrado do antigo /app/admin sem mudar a regra:
 * leitura e promoção usam o client do navegador, protegidos pelo RLS de admin.
 */
export default function AdminCurationPage() {
  const supabase = useMemo(() => createClient(), [])
  const [products, setProducts] = useState<ProductWithOwner[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState("")
  const [selected, setSelected] = useState<MyProduct | null>(null)
  const [isPromoting, setIsPromoting] = useState(false)

  // Incrementar recarrega a lista (ex.: depois de promover um produto)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    MyProductsService.getAllUserProducts(supabase)
      .then((rows) => !cancelled && setProducts(rows))
      .catch((err) => console.error(err))
      .finally(() => !cancelled && setIsLoading(false))
    return () => {
      cancelled = true
    }
  }, [supabase, reloadKey])

  const handlePromote = async (updated: Partial<MyProduct>) => {
    setIsPromoting(true)
    try {
      await MyProductsService.promoteToGlobal(supabase, updated)
      setReloadKey((k) => k + 1)
    } catch {
      alert("Erro ao promover produto.")
    } finally {
      setIsPromoting(false)
      setSelected(null)
    }
  }

  const visible = products.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))

  return (
    <>
      <PageHeader
        title="Curadoria"
        description="Promova produtos criados pelos usuários para o catálogo global (autocomplete)."
        actions={
          <label className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#8a8983]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filtrar por nome"
              className="w-64 rounded-md border border-[#e4e3df] bg-white py-1.5 pl-8 pr-3 text-[13px] outline-none focus:border-[#2a78d6]"
            />
          </label>
        }
      />

      <Card>
        {isLoading ? (
          <div className="py-10 flex justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-[#2a78d6]" />
          </div>
        ) : visible.length === 0 ? (
          <EmptyState text="Nenhum produto pendente de curadoria." />
        ) : (
          <div className="-m-4 overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#f7f7f5] text-[11px] uppercase tracking-wide text-[#8a8983]">
                <tr>
                  <th className="px-4 py-2.5 font-semibold">Produto</th>
                  <th className="px-4 py-2.5 font-semibold">Criado por</th>
                  <th className="px-4 py-2.5 font-semibold">Categoria</th>
                  <th className="px-4 py-2.5 font-semibold">Data</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f0efec]">
                {visible.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafaf9]">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <Package className="w-4 h-4 text-[#8a8983] shrink-0" />
                        <div>
                          <div className="font-medium">{p.name}</div>
                          <div className="text-[12px] text-[#8a8983]">{p.brand || "Marca genérica"}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5">
                      <div>{p.profiles?.full_name || "—"}</div>
                      <div className="text-[12px] text-[#8a8983]">{p.profiles?.email}</div>
                    </td>
                    <td className="px-4 py-2.5 text-[#52514e]">{p.category || "—"}</td>
                    <td className="px-4 py-2.5 text-[#52514e] whitespace-nowrap">{fmtDate(p.created_at)}</td>
                    <td className="px-4 py-2.5 text-right">
                      <button
                        onClick={() => setSelected(p)}
                        className="rounded-md border border-[#e4e3df] px-3 py-1 text-[12px] font-medium hover:border-[#2a78d6] hover:text-[#1d5fae]"
                      >
                        Curar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {selected && (
        <CuratorProductModal
          product={selected}
          onClose={() => setSelected(null)}
          onPromote={handlePromote}
          isPromoting={isPromoting}
        />
      )}
    </>
  )
}
