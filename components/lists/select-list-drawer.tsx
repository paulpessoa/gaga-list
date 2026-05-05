"use client"

import { Drawer } from "vaul"
import { useLists } from "@/hooks/use-lists"
import { ShoppingBag, ChevronRight, Loader2, Sparkles } from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"

interface SelectListDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (listId: string) => void
  friendName: string
}

export function SelectListDrawer({
  isOpen,
  onClose,
  onSelect,
  friendName
}: SelectListDrawerProps) {
  const { data: lists, isLoading } = useLists()
  const { trigger } = useHaptic()

  return (
    <Drawer.Root open={isOpen} onOpenChange={(val) => !val && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]" />
        <Drawer.Content className="bg-[#1c1b1b] flex flex-col rounded-t-[2.5rem] h-[auto] max-h-[80vh] mt-24 fixed bottom-0 left-0 right-0 z-[101] outline-none border-t border-[#3d4a3d] shadow-2xl">
          <div className="p-4 bg-[#1c1b1b] rounded-t-[2.5rem] flex-1 overflow-y-auto pb-12">
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-[#3d4a3d] mb-8" />
            
            <div className="max-w-md mx-auto">
              <div className="mb-8 text-center px-4">
                <div className="w-16 h-16 rounded-3xl flex items-center justify-center mb-6 mx-auto" style={{ background: "rgba(83,224,118,0.10)" }}>
                  <ShoppingBag className="w-8 h-8 text-[#53E076]" />
                </div>
                <Drawer.Title className="text-2xl font-black text-[#e5e2e1] mb-2 tracking-tight">
                  Compartilhar Lista
                </Drawer.Title>
                <Drawer.Description className="text-[#bccbb9] text-sm font-medium">
                  Escolha em qual lista você quer adicionar <strong>{friendName}</strong> como colaborador.
                </Drawer.Description>
              </div>

              <div className="space-y-3">
                {isLoading ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="w-8 h-8 animate-spin text-[#53E076]" />
                  </div>
                ) : lists?.length === 0 ? (
                  <p className="text-center py-10 text-zinc-500 text-sm font-bold">Você não tem listas ativas.</p>
                ) : (
                  lists?.map((list) => (
                    <button
                      key={list.id}
                      onClick={() => { trigger('medium'); onSelect(list.id); }}
                      className="w-full glass-panel p-5 rounded-[1.8rem] flex items-center justify-between hover:border-[#53E076]/25 transition-all group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-[#201f1f] border border-[#3d4a3d] flex items-center justify-center text-lg">
                          🛒
                        </div>
                        <span className="font-black text-sm text-[#e5e2e1] truncate max-w-[180px] uppercase tracking-tight">
                          {list.title}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#bccbb9]/40 group-hover:text-[#53E076] transition-colors" />
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  )
}

