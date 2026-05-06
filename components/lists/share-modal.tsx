"use client"

import { useState, useMemo } from "react"
import {
  X,
  Users,
  Clock,
  Loader2,
  Bell,
  Phone,
  MessageSquare,
  Map as MapIcon,
  MessageCircleMore,
  QrCode,
  Mail,
  UserPlus,
  LogOut,
  Link as LinkIcon
} from "lucide-react"
import { Collaborator } from "@/types"
import { usePresence } from "@/hooks/use-presence"
import { useHaptic } from "@/hooks/use-haptic"
import { formatPhoneForWhatsApp } from "@/lib/utils"
import { createClient } from "@/lib/supabase/client"
import { QRCodeSVG } from "qrcode.react"
import Link from "next/link"
import Image from "next/image"

interface ShareModalProps {
  isOpen: boolean
  onClose: () => void
  listId: string
  listTitle?: string
  collaborators: Collaborator[]
  isOwner: boolean
  currentUser: any
  onAddCollaborator: (
    email: string,
    callbacks: { onSuccess: () => void; onError: (err: any) => void }
  ) => void
  onInviteUser: (
    email: string,
    callbacks: { onSuccess: () => void; onError: (err: any) => void }
  ) => void
  onRemoveCollaborator: (userId: string) => void
}

export function ShareModal({
  isOpen,
  onClose,
  listId,
  listTitle,
  collaborators,
  isOwner,
  currentUser,
  onAddCollaborator,
  onInviteUser,
  onRemoveCollaborator
}: ShareModalProps) {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [showInviteButton, setShowInviteButton] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)
  const [inviteToken, setInviteToken] = useState<string | null>(null)

  const supabase = createClient()
  const { onlineUsers, sendNudge } = usePresence(listId, currentUser, listTitle)
  const { trigger } = useHaptic()

  const otherMembers = useMemo(() => {
    return (
      collaborators?.filter(
        (c) =>
          c.user_id !== currentUser?.id && c.profiles?.id !== currentUser?.id
      ) || []
    )
  }, [collaborators, currentUser?.id])

  if (!isOpen) return null

  const handleNudge = (targetId: string) => {
    sendNudge(targetId)
  }

  const isOnline = (userId: string) => !!onlineUsers[userId]

  const handleGenerateInvite = async () => {
    setIsLoading(true)
    trigger("medium")
    try {
      const { data, error } = await (supabase.from("list_invite_tokens") as any)
        .insert({
          list_id: listId,
          created_by: currentUser.id
        })
        .select("id")
        .single()

      if (error) throw error
      setInviteToken(data.id)
      setIsQrModalOpen(true)
    } catch (err) {
      console.error("Erro ao gerar convite:", err)
      alert("Erro ao gerar QR Code")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return

    setIsLoading(true)
    setShowInviteButton(false)

    onAddCollaborator(email, {
      onSuccess: () => {
        setMessage("Colaborador adicionado com sucesso!")
        setEmail("")
        setIsLoading(false)
        setTimeout(() => setMessage(""), 3000)
      },
      onError: (error: any) => {
        setIsLoading(false)
        if (error.message?.includes("USUARIO_NAO_ENCONTRADO")) {
          setMessage("Este usuário ainda não possui conta.")
          setShowInviteButton(true)
        } else {
          setMessage(`Erro: ${error.message}`)
        }
      }
    })
  }

  const handleInvite = () => {
    setIsLoading(true)
    onInviteUser(email, {
      onSuccess: () => {
        setMessage("Convite enviado!")
        setEmail("")
        setShowInviteButton(false)
        setIsLoading(false)
        setTimeout(() => setMessage(""), 5000)
      },
      onError: (error: any) => {
        setIsLoading(false)
        setMessage(`Erro: ${error.message}`)
      }
    })
  }

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4 bg-[#131313]/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-[#131313] w-full h-full sm:h-auto sm:max-w-md sm:rounded-[2.5rem] p-6 sm:p-10 relative shadow-2xl border-none sm:border-2 sm:border-[#3d4a3d]/30 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 overflow-y-auto scrollbar-hide">
          <div className="absolute top-8 right-8 flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-zinc-400 hover:text-white transition-colors p-2 bg-[#1c1b1b] rounded-xl border border-[#3d4a3d]/60"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="mt-8 sm:mt-0">
            <div className="flex flex-col mb-8">
              <h2 className="text-3xl font-black text-[#e5e2e1] mb-2 tracking-tight">
                Compartilhar
              </h2>
              <p className="text-zinc-500 text-sm">
                Convide amigos e família para a lista.
              </p>
            </div>

            <div className="flex flex-col gap-4 mb-10">
              <button
                onClick={handleGenerateInvite}
                disabled={isLoading}
                className="w-full py-4.5 bg-[#1DB954]/10 border-2 border-dashed border-[#53E076]/20 rounded-[1.25rem] flex items-center justify-center gap-3 text-[#53E076] font-black text-xs uppercase tracking-widest hover:bg-[#53E076] hover:text-[#131313] transition-all active:scale-[0.98] disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <QrCode className="w-5 h-5" /> Convite via QR Code
                  </>
                )}
              </button>

              <div className="flex items-center gap-4 text-[#1c1b1b]">
                <div className="flex-1 h-px bg-current" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500">
                  ou por e-mail
                </span>
                <div className="flex-1 h-px bg-current" />
              </div>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-8">
              <div className="relative">
                <input
                  type="email"
                  placeholder="E-mail do colaborador"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#1c1b1b] border-2 border-[#3d4a3d]/30 focus:border-[#53E076] rounded-[1.25rem] py-4.5 px-6 text-[#e5e2e1] placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner"
                />
                <Mail className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 text-[#3d4a3d]" />
              </div>

              <button
                type="submit"
                disabled={isLoading || !email.trim()}
                className="w-full py-4.5 bg-white text-black rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 shadow-xl"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" /> Adicionar à lista
                  </>
                )}
              </button>
            </form>

            {message && (
              <div
                className={`p-5 rounded-[1.25rem] text-xs font-bold mb-8 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2 ${message.includes("Erro") || message.includes("não possui") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-[#53E076] border border-[#53E076]/20"}`}
              >
                <p className="leading-relaxed">{message}</p>
                {showInviteButton && (
                  <button
                    onClick={handleInvite}
                    className="w-full py-3 px-4 bg-[#1DB954] hover:bg-indigo-600 text-white rounded-xl font-black transition-all text-[9px] uppercase tracking-widest shadow-lg shadow-[#53E076]/20"
                  >
                    Enviar convite oficial do App
                  </button>
                )}
              </div>
            )}

            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 ml-1">
                <Users className="w-4 h-4" />
                Membros ({otherMembers.length})
              </h3>

              <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2 scrollbar-hide pb-10">
                {otherMembers.length === 0 ? (
                  <div className="py-8 text-center bg-[#1c1b1b]/30 rounded-[1.5rem] border border-[#3d4a3d]/30">
                    <p className="text-sm text-zinc-500 font-medium">
                      Você ainda está sozinho nesta lista.
                    </p>
                  </div>
                ) : (
                  otherMembers.map((collab, index) => (
                    <div
                      key={
                        collab.user_id ||
                        collab.profiles?.id ||
                        `collab-${index}`
                      }
                      className="flex flex-col gap-4 p-5 rounded-[1.5rem] bg-[#1c1b1b]/30 border border-[#3d4a3d]/40 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative w-11 h-11 rounded-2xl overflow-hidden border-2 border-[#131313] bg-[#1c1b1b] shadow-sm">
                            <Image
                              src={
                                collab.profiles?.avatar_url ||
                                `https://ui-avatars.com/api/?name=${encodeURIComponent(collab.profiles?.full_name || collab.profiles?.email || "U")}&background=131313&color=53E076`
                              }
                              fill
                              className="object-cover"
                              alt="Avatar"
                            />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-sm font-black ${collab.status === "pending" ? "text-zinc-600" : "text-[#e5e2e1]"}`}
                              >
                                {collab.profiles?.full_name ||
                                  collab.profiles?.email?.split("@")[0] ||
                                  "Usuário"}
                              </span>
                              {collab.role === "owner" && (
                                <span className="bg-[#1DB954]/10 text-[#53E076] text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-[#53E076]/20">
                                  Dono
                                </span>
                              )}
                              {collab.profiles?.id &&
                                isOnline(collab.profiles.id) && (
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                                )}
                            </div>
                            <span className="text-[10px] text-zinc-500 font-bold tracking-tight truncate max-w-[140px]">
                              {collab.profiles?.email}
                            </span>
                          </div>
                        </div>

                        {isOwner && collab.role !== "owner" && (
                          <button
                            onClick={() => {
                              const idToRemove =
                                collab.status === "pending"
                                  ? `pending-${collab.profiles?.email}`
                                  : collab.user_id || collab.profiles?.id
                              if (idToRemove && confirm(`Remover este membro?`))
                                onRemoveCollaborator(idToRemove)
                            }}
                            className="p-2.5 rounded-xl bg-[#131313] text-zinc-600 hover:text-red-500 transition-all border border-[#3d4a3d]/40"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Action Bar */}
                      {collab.status === "active" && (
                        <div className="grid grid-cols-3 gap-2">
                          <button
                            onClick={() => {
                              if (collab.profiles?.id) {
                                trigger("medium")
                                handleNudge(collab.profiles.id)
                              }
                            }}
                            disabled={
                              !collab.profiles?.id ||
                              !isOnline(collab.profiles.id)
                            }
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-[1.25rem] transition-all active:scale-95 border ${isOnline(collab.profiles?.id || "") ? "bg-amber-500/10 border-amber-500/20 text-amber-500 hover:bg-amber-500 hover:text-white shadow-lg shadow-amber-500/20" : "bg-[#131313]/50 border-transparent text-zinc-800 opacity-40 cursor-not-allowed"}`}
                          >
                            <Bell
                              className={`w-4 h-4 ${isOnline(collab.profiles?.id || "") ? "animate-shake" : ""}`}
                            />
                            <span className="text-[8px] font-black uppercase tracking-tighter">
                              Sino
                            </span>
                          </button>

                          <a
                            href={
                              collab.profiles?.phone
                                ? `https://wa.me/${formatPhoneForWhatsApp(collab.profiles.phone)}`
                                : "#"
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex flex-col items-center justify-center gap-2 p-3 rounded-[1.25rem] transition-all active:scale-95 border ${collab.profiles?.phone ? "bg-[#53E076]/10 border-[#53E076]/20 text-[#53E076] hover:bg-[#53E076] hover:text-black shadow-lg shadow-[#53E076]/20" : "bg-[#131313]/50 border-transparent text-zinc-800 cursor-not-allowed"}`}
                            onClick={() =>
                              collab.profiles?.phone && trigger("light")
                            }
                          >
                            <MessageCircleMore className="w-4 h-4" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">
                              Zap
                            </span>
                          </a>

                          <Link
                            href={`/app/lists/${listId}/map`}
                            onClick={() => trigger("light")}
                            className="flex flex-col items-center justify-center gap-2 p-3 rounded-[1.25rem] bg-[#1c1b1b]/50 border border-[#3d4a3d]/60 text-zinc-500 hover:bg-white hover:text-black transition-all active:scale-95"
                          >
                            <MapIcon className="w-4 h-4" />
                            <span className="text-[8px] font-black uppercase tracking-tighter">
                              Mapa
                            </span>
                          </Link>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* QR Code Modal Overlay */}
      {isQrModalOpen && inviteToken && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-[#131313]/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#131313] w-full max-w-sm rounded-[3rem] p-12 flex flex-col items-center text-center relative shadow-2xl border-2 border-[#3d4a3d]/30 animate-in zoom-in-95 duration-200">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-10 right-10 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-7 h-7" />
            </button>

            <h2 className="text-2xl font-black text-[#e5e2e1] mb-2">
              Convite Rápido
            </h2>
            <p className="text-zinc-500 text-sm mb-10 leading-relaxed">
              Aponte a câmera para entrar na lista instantaneamente.
            </p>

            <div className="p-8 bg-white rounded-[2.5rem] shadow-inner mb-8 border-4 border-[#1c1b1b]">
              <QRCodeSVG
                value={`${window.location.origin}/join/${inviteToken}`}
                size={220}
                level="H"
                includeMargin={false}
                imageSettings={{
                  src: "/icon-192x192.png",
                  x: undefined,
                  y: undefined,
                  height: 40,
                  width: 40,
                  excavate: true,
                }}
              />
            </div>

            <div className="flex flex-col items-center gap-4 w-full mt-2">
              <div className="bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full">
                Válido por 24 horas
              </div>

              <button
                onClick={() => {
                  trigger("medium")
                  const url = `${window.location.origin}/join/${inviteToken}`
                  navigator.clipboard.writeText(url)
                  alert("Link de convite copiado!")
                }}
                className="w-full py-4 border-2 border-[#53E076]/20 bg-[#53E076]/5 text-[#53E076] hover:bg-[#53E076] hover:text-[#131313] rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <LinkIcon className="w-4 h-4" /> Copiar Link de Convite
              </button>
            </div>

            <button
              onClick={() => setIsQrModalOpen(false)}
              className="mt-6 w-full py-4.5 bg-white text-black rounded-[1.25rem] font-black text-xs uppercase tracking-widest transition-all active:scale-95 shadow-xl"
            >
              Concluído
            </button>
          </div>
        </div>
      )}
    </>
  )
}

