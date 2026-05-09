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
  X,
  Trash2,
  Pencil
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
  
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [newName, setNewName] = useState("")
  const [isUpdatingName, setIsUpdatingName] = useState(false)

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
          setNewName(data.full_name || "")
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

    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!vapidKey) {
      alert("Configuração Pendente: A chave VAPID não foi encontrada. Se você estiver em desenvolvimento local, adicione NEXT_PUBLIC_VAPID_PUBLIC_KEY ao seu .env.local")
      return
    }

    setIsUpdatingPush(true)
    trigger("light")
    try {
      if (isPushEnabled) {
        await unsubscribeUser()
        setIsPushEnabled(false)
      } else {
        const registration = await navigator.serviceWorker.ready
        if (!registration.pushManager) {
          throw new Error("Push Manager não disponível no navegador.")
        }

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: vapidKey
        })
        const result = await subscribeUser(sub as any)
        if (result.success) setIsPushEnabled(true)
      }
    } catch (err: any) {
      console.error(err)
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        alert("Erro de Segurança: Notificações Push exigem HTTPS. O navegador bloqueou a solicitação por segurança.")
      } else {
        alert("Erro ao ativar notificações: " + (err.message || "Verifique se você permitiu notificações no navegador."))
      }
    } finally {
      setIsUpdatingPush(false)
    }
  }

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteAccount = async () => {
    if (deleteConfirmEmail !== (profile?.email || user?.email)) return
    setIsDeleting(true)
    trigger("heavy")
    try {
      const { error } = await (supabase.from('profiles') as any)
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user?.id)

      if (error) throw error

      alert("Sua solicitação foi registrada. Sua conta será removida em 30 dias.")
      await supabase.auth.signOut()
      router.push("/")
    } catch (err) {
      alert("Erro ao processar solicitação.")
    } finally {
      setIsDeleting(false)
      setIsDeleteModalOpen(false)
    }
  }

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setIsUploadingPhoto(true)
    trigger("medium")

    try {
      const fileExt = file.name.split('.').pop()
      const filePath = `${user.id}/${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile((prev: any) => ({ ...prev, avatar_url: publicUrl }))
      trigger("success")
    } catch (err: any) {
      console.error(err)
      alert("Erro ao enviar foto: " + (err.message || "Verifique o bucket 'avatars'"))
    } finally {
      setIsUploadingPhoto(false)
    }
  }

  const handleUpdateName = async () => {
    if (!newName.trim() || !user) return
    setIsUpdatingName(true)
    trigger("medium")
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: newName.trim() })
        .eq("id", user.id)

      if (error) throw error
      
      setProfile((prev: any) => ({ ...prev, full_name: newName.trim() }))
      setIsEditingName(false)
      trigger("success")
    } catch (err) {
      console.error(err)
      alert("Erro ao atualizar nome.")
    } finally {
      setIsUpdatingName(false)
    }
  }

  if (userLoading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#131313]">
        <Loader2 className="w-8 h-8 animate-spin text-[#53E076]" />
      </div>
    )

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-10 pb-32 bg-[#131313]">
      <header className="flex flex-col gap-8">
        <div className="flex items-center gap-4">
          <Link
            href="/app"
            onClick={() => trigger("light")}
            className="w-12 h-12 rounded-[1.25rem] bg-[#1c1b1b] flex items-center justify-center text-zinc-400 hover:text-[#53E076] transition-all active:scale-95 shrink-0 border border-[#3d4a3d]/60"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-black tracking-tight text-[#e5e2e1] leading-tight">
              Ajustes
            </h1>
            <p className="text-sm text-zinc-500 font-medium uppercase tracking-widest opacity-70">
              Gerencie seu perfil e preferências
            </p>
          </div>
        </div>
      </header>

      {/* Identidade / Card de Perfil */}
      <section className="space-y-4">
        <div className="flex items-center gap-2 ml-1">
          <User className="w-3.5 h-3.5 text-zinc-400" />
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
            Identidade
          </h2>
        </div>
        <div className="p-8 rounded-[3rem] bg-[#1c1b1b] border border-[#3d4a3d]/40 flex flex-col items-center text-center gap-6 relative overflow-hidden shadow-2xl">
          <div className="w-28 h-28 rounded-[2.5rem] bg-[#131313] border-2 border-[#3d4a3d]/60 shadow-2xl flex items-center justify-center relative group">
            {isUploadingPhoto ? (
              <Loader2 className="w-8 h-8 animate-spin text-[#53E076]" />
            ) : profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ""}
                className="w-full h-full object-cover rounded-[2.2rem]"
              />
            ) : (
              <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-br from-zinc-800 to-zinc-900 flex items-center justify-center">
                <User className="w-12 h-12 text-[#53E076]" />
              </div>
            )}
            
            <label className="absolute -bottom-1 -right-1 w-10 h-10 bg-[#201f1f] rounded-2xl shadow-xl border border-[#3d4a3d]/60 flex items-center justify-center text-[#53E076] hover:bg-[#53E076] hover:text-black transition-all active:scale-90 cursor-pointer">
              <Camera className="w-5 h-5" />
              <input 
                type="file" 
                className="hidden" 
                accept="image/*" 
                onChange={handleUploadPhoto}
                disabled={isUploadingPhoto}
              />
            </label>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            {isEditingName ? (
              <div className="flex items-center gap-2 animate-in fade-in zoom-in duration-300">
                <input
                  autoFocus
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="bg-[#131313] border-2 border-[#53E076]/40 rounded-2xl py-3 px-6 text-center font-black text-[#e5e2e1] outline-none focus:border-[#53E076] transition-all"
                />
                <button
                  onClick={handleUpdateName}
                  disabled={isUpdatingName}
                  className="p-3 bg-[#53E076] text-black rounded-2xl active:scale-90 transition-all disabled:opacity-50"
                >
                  {isUpdatingName ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
                </button>
                <button
                  onClick={() => { setIsEditingName(false); setNewName(profile?.full_name || ""); }}
                  className="p-3 bg-[#201f1f] text-zinc-400 rounded-2xl active:scale-90 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group cursor-pointer" onClick={() => setIsEditingName(true)}>
                <h3 className="text-2xl font-black text-[#e5e2e1] tracking-tight">
                  {profile?.full_name || "Usuário"}
                </h3>
                <Pencil className="w-4 h-4 text-zinc-600 group-hover:text-[#53E076] transition-colors" />
              </div>
            )}
            <p className="text-sm text-zinc-500 font-bold uppercase tracking-widest opacity-60">
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
          className="p-8 rounded-[2.5rem] flex items-center justify-between group hover:border-[#53E076]/40 transition-all bg-[#1c1b1b] border border-[#3d4a3d]/40 shadow-2xl"
        >
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-[1.5rem] bg-amber-500/10 text-amber-500 flex items-center justify-center shadow-inner border border-amber-500/10">
              <Zap className="w-7 h-7 fill-current" />
            </div>
            <div>
              <p className="text-lg font-black text-[#e5e2e1] tracking-tight">
                Grãos Mágicos
              </p>
              <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest opacity-60">
                {credits} grãos ativos
              </p>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-[#201f1f] flex items-center justify-center text-zinc-600 group-hover:bg-[#53E076] group-hover:text-black transition-all border border-[#3d4a3d]/40 shadow-lg">
            <ChevronRight className="w-6 h-6" />
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
        <div className="rounded-[2.5rem] overflow-hidden border border-[#3d4a3d]/40 bg-[#1c1b1b] shadow-2xl">
          {/* Notificações Push */}
          <div className="p-7 flex items-center justify-between border-b border-[#3d4a3d]/30">
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center border border-rose-500/10">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#e5e2e1] tracking-tight">
                Notificações Push
              </span>
            </div>
            <button
              onClick={togglePush}
              disabled={isUpdatingPush}
              className={`w-14 h-7 rounded-full transition-all relative ${isPushEnabled ? "bg-[#53E076]" : "bg-[#201f1f]"}`}
            >
              <div
                className={`absolute top-1 w-5 h-5 rounded-full shadow-lg transition-all ${isPushEnabled ? "left-8 bg-black" : "left-1 bg-zinc-600"}`}
              />
            </button>
          </div>

          {/* Central de Notificações */}
          <Link
            href="/app/notifications"
            onClick={() => trigger("light")}
            className="p-7 flex items-center justify-between hover:bg-zinc-800/30 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center border border-indigo-500/10">
                <Bell className="w-5 h-5" />
              </div>
              <span className="text-sm font-bold text-[#e5e2e1] tracking-tight">
                Central de Avisos
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-[#53E076] transition-all" />
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
        <Link
          href="/app/help"
          onClick={() => trigger("light")}
          className="p-7 rounded-[2rem] flex items-center justify-between group hover:border-[#53E076]/40 transition-all bg-[#1c1b1b] border border-[#3d4a3d]/40 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-zinc-800/50 text-zinc-400 flex items-center justify-center border border-zinc-800">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-[#e5e2e1] tracking-tight">
              Central de Ajuda
            </span>
          </div>
          <ChevronRight className="w-5 h-5 text-zinc-600 group-hover:text-[#53E076] transition-all" />
        </Link>
      </section>

      {/* Ações de Conta */}
      <section className="mt-4 pt-10 border-t border-[#3d4a3d]/30 space-y-4">
        <button
          onClick={handleLogout}
          className="w-full py-5 bg-[#1c1b1b] hover:bg-[#201f1f] text-[#bccbb9] rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl border border-[#3d4a3d]/20"
        >
          <LogOut className="w-4 h-4" /> Sair da Conta
        </button>

        <button
          onClick={() => { trigger("medium"); setIsDeleteModalOpen(true); }}
          className="w-full py-5 bg-rose-500/5 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex items-center justify-center gap-3"
        >
          <Trash2 className="w-4 h-4" /> Excluir Minha Conta
        </button>

        {/* Modal de Exclusão */}
        <AnimatePresence>
          {isDeleteModalOpen && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsDeleteModalOpen(false)}
                className="absolute inset-0 bg-black/80 backdrop-blur-md"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
                className="relative w-full max-w-sm bg-[#131313] rounded-[3rem] p-10 shadow-2xl border border-rose-500/20 text-center overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-2 bg-rose-500" />
                <div className="w-20 h-20 bg-rose-500/10 rounded-[2.5rem] flex items-center justify-center mb-8 mx-auto">
                  <Shield className="w-10 h-10 text-rose-500" />
                </div>
                <h2 className="text-2xl font-black text-[#e5e2e1] mb-4 tracking-tight">
                  Zona de Perigo
                </h2>
                <div className="text-[#bccbb9] text-sm font-medium space-y-4 mb-10 text-left">
                  <p>Ao confirmar a exclusão:</p>
                  <ul className="list-disc pl-5 space-y-2 text-xs">
                    <li>Sua conta será desativada imediatamente.</li>
                    <li>Dados removidos definitivamente em 30 dias.</li>
                  </ul>
                </div>
                <div className="space-y-4">
                  <input
                    type="email"
                    placeholder={user?.email}
                    value={deleteConfirmEmail}
                    onChange={(e) => setDeleteConfirmEmail(e.target.value)}
                    className="w-full bg-[#1c1b1b] border-2 border-transparent focus:border-rose-500 rounded-2xl py-4 px-5 text-sm font-bold outline-none transition-all shadow-inner text-[#e5e2e1]"
                  />
                  <button
                    onClick={handleDeleteAccount}
                    disabled={isDeleting || deleteConfirmEmail !== (profile?.email || user?.email)}
                    className="w-full py-5 bg-rose-500 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirmar Exclusão"}
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        <footer className="text-center space-y-1">
          <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">
            Gaga List v1.1.0
          </p>
        </footer>
      </section>
    </main>
  )
}
