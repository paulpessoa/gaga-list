"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import {
  Users,
  UserPlus,
  Search,
  ChevronRight,
  MessageCircle,
  Clock,
  Check,
  X,
  Loader2,
  Mail,
  Zap,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"
import Image from "next/image"
import { SelectListDrawer } from "@/components/lists/select-list-drawer"
import { useAICosts } from "@/hooks/use-ai-costs"

export default function PeoplePage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { trigger } = useHaptic()
  const { costs } = useAICosts()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Estados de Interação
  const [selectedFriend, setSelectedFriend] = useState<any>(null)
  const [isSelectDrawerOpen, setIsSelectDrawerOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [isInviting, setIsInviting] = useState(false)

  const fetchFriends = async () => {
    if (!user) return
    setIsLoading(true)
    const { data, error } = await supabase
      .from("list_collaborators")
      .select(
        `
        user_id,
        profiles:user_id (id, full_name, avatar_url, email)
      `
      )
      .not("user_id", "eq", user.id)

    if (!error && data) {
      const uniqueFriends = Array.from(new Set(data.map((d) => d.profiles?.id)))
        .map((id) => data.find((d) => d.profiles?.id === id)?.profiles)
        .filter(Boolean)
      setFriends(uniqueFriends)
    }
    setIsLoading(false)
  }

  useEffect(() => {
    fetchFriends()
  }, [user, supabase])

  const handleInviteByEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteEmail.trim()) return
    setIsInviting(true)
    trigger("medium")
    try {
      // Chamada para a rota de convite que registra o referral
      const response = await fetch("/api/push/nudge", {
        // Vou criar ou ajustar uma rota para convite
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          type: "invite_referral",
          invitedBy: user?.id
        })
      })

      alert(
        `Convite enviado para ${inviteEmail}! Você ganhará 50 grãos quando ele se cadastrar.`
      )
      setInviteEmail("")
    } catch (err) {
      alert("Erro ao enviar convite.")
    } finally {
      setIsInviting(false)
    }
  }

  const handleAddToSelectedList = async (listId: string) => {
    if (!selectedFriend) return
    trigger("success")
    try {
      const { error } = await supabase.from("list_collaborators").insert({
        list_id: listId,
        user_id: selectedFriend.id,
        role: "editor"
      })

      if (error) {
        if (error.code === "23505") alert("Esta pessoa já está nesta lista.")
        else throw error
      } else {
        alert(
          `${selectedFriend.full_name || selectedFriend.email} foi adicionado à lista!`
        )
      }
    } catch (err) {
      alert("Erro ao adicionar colaborador.")
    } finally {
      setIsSelectDrawerOpen(false)
      setSelectedFriend(null)
    }
  }

  const filteredFriends = friends.filter(
    (f) =>
      f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )

  return (
    <main className="min-h-screen p-5 md:p-10 max-w-4xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          Pessoas
        </h1>
        <p className="text-sm text-zinc-500 font-medium">
          Gerencie seus contatos e parcerias de compras
        </p>
      </header>

      {/* Convite Viral (Referral) */}
      <section className="glass-panel p-8 rounded-[2.5rem] bg-indigo-500/5 border-2 border-indigo-500/10 flex flex-col gap-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-4 -mt-4 opacity-10">
          <Zap className="w-32 h-32 text-indigo-500" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500 text-white flex items-center justify-center shadow-lg">
              <UserPlus className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">
              Convidar Amigos
            </h2>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 font-medium mb-6 leading-relaxed">
            Convide alguém para o app. Quando eles entrarem, você ganha{" "}
            <strong>{costs.referral_bonus} grãos mágicos</strong>! 🌾
          </p>
          <form
            onSubmit={handleInviteByEmail}
            className="flex flex-col sm:flex-row gap-3"
          >
            <input
              type="email"
              placeholder="E-mail do seu amigo..."
              required
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="flex-1 bg-white dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 px-6 text-sm font-bold outline-none shadow-inner"
            />
            <button
              disabled={isInviting}
              className="px-8 py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
            >
              {isInviting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Convidar e Ganhar"
              )}
            </button>
          </form>
        </div>
      </section>

      {/* Busca e Lista */}
      <div className="space-y-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar nos seus contatos..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-[1.5rem] py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
          />
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2 ml-1">
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Seus Contatos ({filteredFriends.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-[1.5rem] animate-pulse"
                />
              ))}
            </div>
          ) : filteredFriends.length === 0 ? (
            <div className="py-20 text-center space-y-4 bg-zinc-50 dark:bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-100 dark:border-white/5">
              <Users className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto" />
              <p className="text-zinc-500 text-sm font-medium">
                Nenhum contato encontrado.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {filteredFriends.map((friend) => (
                <div
                  key={friend.id}
                  className="glass-panel p-4 px-5 rounded-[2rem] flex items-center justify-between bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5 hover:border-indigo-500/20 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl border-2 border-white dark:border-zinc-900 overflow-hidden bg-zinc-100 dark:bg-zinc-800 relative shadow-sm">
                      <Image
                        src={
                          friend.avatar_url ||
                          `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.email)}&background=6366f1&color=fff`
                        }
                        fill
                        className="object-cover"
                        alt="Avatar"
                      />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                        {friend.full_name || "Usuário Anon"}
                      </span>
                      <span className="text-[10px] text-zinc-500 font-bold tracking-tight">
                        {friend.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFriend(friend)
                        setIsSelectDrawerOpen(true)
                        trigger("medium")
                      }}
                      className="px-4 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-black font-black text-[9px] uppercase tracking-widest active:scale-95 transition-all shadow-lg"
                    >
                      Add Lista
                    </button>
                    <Link
                      href={`/app?openChat=true&targetId=${friend.id}`}
                      onClick={() => trigger("light")}
                      className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-500 transition-all shadow-inner"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      <SelectListDrawer
        isOpen={isSelectDrawerOpen}
        onClose={() => setIsSelectDrawerOpen(false)}
        onSelect={handleAddToSelectedList}
        friendName={selectedFriend?.full_name || selectedFriend?.email || ""}
      />

      <footer className="mt-10 pt-10 border-t border-zinc-100 dark:border-white/5 text-center">
        <p className="text-[8px] text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-tighter">
          Conexão é a chave para a harmonia nas compras
        </p>
      </footer>
    </main>
  )
}
