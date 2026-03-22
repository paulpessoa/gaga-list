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
  Loader2
} from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"
import Image from "next/image"

export default function PeoplePage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()

  const [searchQuery, setSearchQuery] = useState("")
  const [friends, setFriends] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      const fetchFriends = async () => {
        // Staff Insight: Por enquanto, "Pessoas" são colaboradores de listas em comum
        // Em uma fase futura, teremos uma tabela real de 'friendships'
        const { data, error } = await supabase
          .from('list_collaborators')
          .select(`
            user_id,
            profiles:user_id (id, full_name, avatar_url, email)
          `)
          .not('user_id', 'eq', user.id)

        if (!error && data) {
          // Remover duplicatas
          const uniqueFriends = Array.from(new Set(data.map(d => d.profiles?.id)))
            .map(id => data.find(d => d.profiles?.id === id)?.profiles)
            .filter(Boolean)
          
          setFriends(uniqueFriends)
        }
        setIsLoading(false)
      }
      fetchFriends()
    }
  }, [user, supabase])

  const filteredFriends = friends.filter(f => 
    f.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (userLoading) return (
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

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input 
          type="text"
          placeholder="Buscar por nome ou e-mail..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-900 border-none rounded-[1.5rem] py-4 pl-12 pr-6 text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none shadow-inner"
        />
      </div>

      {/* Convites Pendentes Section (Placeholder para lógica futura) */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Clock className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Pendentes</h2>
        </div>
        <div className="bg-indigo-500/5 border-2 border-dashed border-indigo-500/10 rounded-[2rem] p-8 text-center">
          <p className="text-zinc-500 text-xs font-medium">Nenhum convite pendente no momento.</p>
        </div>
      </section>

      {/* Lista de Amigos/Contatos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Users className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Seus Contatos ({filteredFriends.length})</h2>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-zinc-100 dark:bg-zinc-900 rounded-[1.5rem] animate-pulse" />)}
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="py-20 text-center space-y-4">
            <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 rounded-full flex items-center justify-center mx-auto text-zinc-300">
              <Users className="w-8 h-8" />
            </div>
            <p className="text-zinc-500 text-sm font-medium">Você ainda não tem contatos salvos.</p>
            <button className="px-6 py-3 bg-indigo-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg active:scale-95 transition-all">
              Convidar Alguém
            </button>
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
                      src={friend.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(friend.full_name || friend.email)}&background=6366f1&color=fff`}
                      fill
                      className="object-cover"
                      alt="Avatar"
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{friend.full_name || "Usuário Anon"}</span>
                    <span className="text-[10px] text-zinc-500 font-bold tracking-tight">{friend.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => trigger('light')}
                    className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-inner"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => trigger('light')}
                    className="w-10 h-10 rounded-xl bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-indigo-500 hover:bg-white dark:hover:bg-zinc-700 transition-all shadow-inner"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Footer Motivacional Staff */}
      <footer className="mt-10 pt-10 border-t border-zinc-100 dark:border-white/5 text-center">
        <p className="text-[8px] text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-tighter">
          Conexão é a chave para a harmonia nas compras
        </p>
      </footer>
    </main>
  )
}
