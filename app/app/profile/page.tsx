"use client"

import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Bell,
  Moon,
  LogOut,
  ChevronRight,
  Shield,
  Smartphone,
  Zap,
  HelpCircle,
  ArrowLeft,
  Loader2,
  Camera,
  Check,
  CreditCard,
  Trash2
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"
import { subscribeUser, unsubscribeUser } from "@/app/actions"
import { motion, AnimatePresence } from "framer-motion"

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  const router = useRouter()

  const [isPushEnabled, setIsPushEnabled] = useState(false)
  const [isUpdatingPush, setIsUpdatingPush] = useState(false)
  const [credits, setCredits] = useState(0)
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", user.id)
          .single()
        if (data) {
          setProfile(data)
          setCredits(data.credits || 0)
          setIsPushEnabled(!!data.push_subscription)
        }
      }
      fetchData()
    }
  }, [user, supabase])

  const handleLogout = async () => {
    trigger("medium")
    await supabase.auth.signOut()
    router.push("/")
  }

  const togglePush = async () => {
    if (!user) return
    setIsUpdatingPush(true)
    trigger("light")
    try {
      if (isPushEnabled) {
        await unsubscribeUser()
        setIsPushEnabled(false)
      } else {
        // Registrar Service Worker e obter assinatura
        const registration = await navigator.serviceWorker.ready
        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        })
        const result = await subscribeUser(sub as any)
        if (result.success) setIsPushEnabled(true)
      }
    } catch (err) {
      console.error(err)
      alert("Erro ao ajustar notificações. Verifique se o site está em HTTPS.")
    } finally {
      setIsUpdatingPush(false)
    }
  }

  // Estados de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== (profile?.email || user?.email)) return
    setIsDeleting(true)
    trigger("heavy")
    try {
      // Aqui dispararíamos uma Edge Function ou Rota de API para marcar exclusão em 30 dias
      const { error } = await (supabase
        .from('profiles') as any)
        .update({ 
          deleted_at: new Date().toISOString(),
          // Adicionar flag ou nota para o admin se necessário
        })
        .eq('id', user?.id)

      if (error) throw error
      
      alert("Sua solicitação foi registrada. Sua conta e dados serão removidos definitivamente em 30 dias. Você será deslogado agora.")
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      alert("Erro ao processar solicitação. Tente novamente.")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-zinc-950">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    )

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-10 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
          Ajustes
        </h1>
        <p className="text-sm text-zinc-500 font-medium">
          Gerencie seu perfil e preferências do app
        </p>
      </header>

      {/* Identidade / Card de Perfil */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Identidade
          </h2>
        </div>
        <div className="glass-panel p-8 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-2 border-indigo-500/10 flex flex-col items-center text-center gap-4 relative overflow-hidden">
          <div className="w-24 h-24 rounded-[2rem] bg-indigo-500/10 border-4 border-white dark:border-zinc-900 shadow-2xl flex items-center justify-center relative group">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ""}
                className="w-full h-full object-cover rounded-[1.8rem]"
              />
            ) : (
              <User className="w-10 h-10 text-indigo-500" />
            )}
            <button className="absolute -bottom-2 -right-2 w-8 h-8 bg-white dark:bg-zinc-800 rounded-full shadow-lg border border-zinc-100 dark:border-white/5 flex items-center justify-center text-zinc-500 hover:text-indigo-500 transition-all active:scale-90">
              <Camera className="w-4 h-4" />
            </button>
          </div>
          <div>
            <h3 className="text-xl font-black text-zinc-900 dark:text-white">
              {profile?.full_name || "Usuário"}
            </h3>
            <p className="text-sm text-zinc-500 font-medium">
              {profile?.email || user?.email}
            </p>
          </div>
        </div>
      </section>

      {/* Energia e Créditos */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Zap className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Energia IA
          </h2>
        </div>
        <Link
          href="/app/credits"
          onClick={() => trigger("light")}
          className="glass-panel p-6 rounded-[2rem] flex items-center justify-between group hover:border-indigo-500/30 transition-all bg-white dark:bg-zinc-900/40"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner">
              <Zap className="w-6 h-6 fill-current" />
            </div>
            <div>
              <p className="text-sm font-black text-zinc-900 dark:text-white">
                Meus Grãos Mágicos
              </p>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">
                {credits} disponíveis
              </p>
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-zinc-50 dark:bg-zinc-800 flex items-center justify-center text-zinc-300 group-hover:bg-indigo-500 group-hover:text-white transition-all">
            <ChevronRight className="w-5 h-5" />
          </div>
        </Link>
      </section>

      {/* Preferências do App */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <Smartphone className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Preferências do App
          </h2>
        </div>
        <div className="glass-panel rounded-[2.5rem] overflow-hidden border border-zinc-100 dark:border-white/5 bg-white dark:bg-zinc-900/40">
          {/* Notificações Push */}
          <div className="p-6 flex items-center justify-between border-b border-zinc-50 dark:border-white/5">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Notificações Push
              </span>
            </div>
            <button
              onClick={togglePush}
              disabled={isUpdatingPush}
              className={`w-12 h-6 rounded-full transition-all relative ${isPushEnabled ? "bg-emerald-500" : "bg-zinc-200 dark:bg-zinc-800"}`}
            >
              <div
                className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${isPushEnabled ? "left-7" : "left-1"}`}
              />
            </button>
          </div>

          {/* Central de Notificações */}
          <Link
            href="/app/notifications"
            onClick={() => trigger("light")}
            className="p-6 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Central de Avisos
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-300" />
          </Link>
        </div>
      </section>

      {/* Suporte e Ajuda */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <HelpCircle className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Ajuda
          </h2>
        </div>
        <div className="grid grid-cols-1 gap-3">
          <Link 
            href="/app/help"
            onClick={() => trigger("light")}
            className="glass-panel p-5 rounded-2xl flex items-center justify-between group hover:border-indigo-500/20 transition-all bg-white dark:bg-zinc-900/40 border border-zinc-100 dark:border-white/5"
          >
            <div className="flex items-center gap-4">
              <HelpCircle className="w-5 h-5 text-zinc-400" />
              <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                Central de Ajuda
              </span>
            </div>
            <ChevronRight className="w-4 h-4 text-zinc-300" />
          </Link>
        </div>
      </section>

      {/* Ações de Conta */}
      <section className="mt-4 pt-10 border-t border-zinc-100 dark:border-zinc-900/50 space-y-4">
        <button
          onClick={handleLogout}
          className="w-full py-5 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-sm"
        >
          <LogOut className="w-4 h-4" /> Sair da Conta
        </button>

        <button
          onClick={() => { trigger("medium"); setIsDeleteModalOpen(true); }}
          className="w-full py-5 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Trash2 className="w-4 h-4" /> Excluir Minha Conta
        </button>

        {/* Modal de Exclusão (Danger Zone) */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeleteModalOpen(false)}
                className="absolute inset-0 bg-black/60 backdrop-blur-md"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-white dark:bg-zinc-950 rounded-[3rem] p-10 shadow-2xl border border-rose-500/20 text-center overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                
                <div className="w-20 h-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto">
                  <Shield className="w-10 h-10 text-rose-500" />
                </div>

                <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 tracking-tight">
                  Zona de Perigo
                </h2>
                
                <div className="text-zinc-500 dark:text-zinc-400 text-sm font-medium space-y-4 mb-10 text-left">
                  <p>Ao confirmar a exclusão:</p>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>Sua conta será desativada imediatamente.</li>
                    <li>Todos os seus dados (listas, receitas, grãos) serão **removidos definitivamente em 30 dias**.</li>
                    <li>Este processo é **irreversível** após o prazo.</li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2 text-left">
                    <label className="text-[9px] font-black uppercase tracking-widest text-zinc-400 ml-1">
                      Confirme seu e-mail para prosseguir
                    </label>
                    <input 
                      type="email"
                      placeholder={user?.email}
                      value={deleteConfirmEmail}
                      onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-900 border-2 border-transparent focus:border-rose-500 rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all shadow-inner"
                    />
                  </div>

                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmEmail !== (profile?.email || user?.email)}
                    className="w-full py-5 bg-rose-500 hover:bg-rose-600 disabled:bg-zinc-100 dark:disabled:bg-zinc-900 disabled:text-zinc-400 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-rose-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Exclusão"}
                  </button>
                  
                  <button 
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="w-full py-2 text-zinc-400 font-black uppercase tracking-widest text-[9px] hover:text-zinc-900 dark:hover:text-white transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="text-center space-y-1">
          <p className="text-[10px] text-zinc-400 dark:text-zinc-600 uppercase font-black tracking-widest">
            Lista Pronta v1.1.0
          </p>
          <p className="text-[8px] text-zinc-300 dark:text-zinc-700 font-bold uppercase tracking-tighter">
            Feito para Casais em Harmonia
          </p>
        </footer>
      </section>
    </main>
  )
}
