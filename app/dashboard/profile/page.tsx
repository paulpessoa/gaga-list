"use client"

import { useUser } from "@/hooks/use-user"
import {
  ArrowLeft,
  User,
  Mail,
  Palette,
  Save,
  MapPin,
  Camera,
  Loader2,
  LogOut,
  Bell,
  BellOff,
  Phone,
  Lock,
  Sun,
  Moon,
  Monitor
} from "lucide-react"
import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { useHaptic } from "@/hooks/use-haptic"
import { createClient } from "@/lib/supabase/client"
import { subscribeUser, unsubscribeUser } from "@/app/actions"
import type { Database, Json } from "@/types/database.types"
import Image from "next/image"

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

// Função auxiliar para VAPID
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/")
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export default function ProfilePage() {
  const { data: user, isLoading: userLoading } = useUser()
  const { trigger } = useHaptic()
  const supabase = createClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Perfil
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [allowNotifications, setAllowNotifications] = useState(true)
  const [pushSubscription, setPushSubscription] = useState<Json | null>(null)

  // Push Subscription State (Browser Object)
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [isPushProcessing, setIsPushProcessing] = useState(false)

  // Tema
  const [theme, setTheme] = useState<"light" | "dark" | "system">("dark")

  // Senha
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  // UI
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    // Check Push Support
    if (typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window) {
      setIsPushSupported(true)
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager.getSubscription().then((sub) => {
          setSubscription(sub)
        })
      })
    }

    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system"
    if (savedTheme) setTheme(savedTheme)

    if (user) {
      const fetchProfile = async () => {
        try {
          const { data, error } = await (supabase.from("profiles") as any)
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          if (error) throw error

          if (data) {
            setFullName(data.full_name || "")
            setAvatarUrl(data.avatar_url)
            setLocationEnabled(!!data.location_enabled)
            setPhone(data.phone || "")
            setAllowNotifications(!!data.allow_notifications)
            setPushSubscription(data.push_subscription)
          }
        } catch (err) {
          console.error("Erro ao carregar perfil:", err)
        }
      }
      fetchProfile()
    }
  }, [user, supabase])

  const handleTogglePush = async () => {
    setIsPushProcessing(true)
    try {
      if (subscription) {
        await subscription.unsubscribe()
        setSubscription(null)
        setPushSubscription(null)
        await unsubscribeUser()
        trigger("medium")
      } else {
        const registration = await navigator.serviceWorker.ready
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        if (!vapidPublicKey) throw new Error("Chave VAPID pública não encontrada")

        const sub = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
        setSubscription(sub)
        setPushSubscription(sub as any)
        await subscribeUser(sub)
        trigger("success" as any)
      }
    } catch (err: any) {
      console.error("Erro no Push:", err)
      alert("Erro: Para ativar notificações, o site precisa estar em HTTPS (SSL).")
    } finally {
      setIsPushProcessing(false)
    }
  }

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    const root = window.document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else if (newTheme === "light") {
      root.classList.remove("dark")
    } else {
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      root.classList.toggle("dark", systemDark)
    }
    trigger("light")
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return
    setIsUploading(true)
    trigger("light")
    try {
      const fileExt = file.name.split(".").pop()
      const filePath = `${user.id}/avatar.${fileExt}`
      const { error: uploadError } = await supabase.storage.from("avatars").upload(filePath, file, { upsert: true })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(filePath)
      const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`
      await (supabase.from("profiles") as any).update({ avatar_url: publicUrlWithTimestamp }).eq("id", user.id)
      setAvatarUrl(publicUrlWithTimestamp)
      setMessage("Foto atualizada!")
    } catch (error: any) {
      setMessage(`Erro: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setIsSaving(true)
    setMessage("")
    trigger("medium")
    try {
      const updateData: ProfileUpdate = {
        full_name: fullName,
        location_enabled: locationEnabled,
        phone: phone,
        allow_notifications: allowNotifications,
        push_subscription: pushSubscription // Agora tipado como Json | null e opcional no Update
      }
      const { error: profileError } = await (supabase.from("profiles") as any).update(updateData).eq("id", user.id)
      if (profileError) throw profileError
      
      if (newPassword) {
        if (newPassword !== confirmPassword) throw new Error("As senhas não coincidem")
        const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword })
        if (passwordError) throw passwordError
        setNewPassword("")
        setConfirmPassword("")
      }

      await supabase.auth.updateUser({ data: { full_name: fullName } })
      setMessage("Configurações salvas!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error: any) {
      setMessage(`Erro: ${error.message}`)
    } finally {
      setIsSaving(false)
    }
  }

  const handleLogout = async () => {
    trigger("heavy")
    try {
      await fetch("/api/auth/logout", { method: "POST" })
      window.location.href = "/"
    } catch (error) {
      console.error("Erro ao sair:", error)
    }
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-center gap-4">
        <Link href="/dashboard" className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">Configurações</h1>
      </header>

      {userLoading ? (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-8 animate-pulse flex flex-col items-center gap-4 border border-zinc-200 dark:border-white/5">
          <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800/50" />
          <div className="w-48 h-6 bg-zinc-200 dark:bg-zinc-800/50 rounded-md" />
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl p-8 border border-zinc-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  {avatarUrl ? (
                    <div className="relative w-full h-full">
                      <Image src={avatarUrl} fill className="object-cover" alt="Sua foto de perfil" sizes="80px" />
                    </div>
                  ) : (
                    <User className="w-12 h-12 text-zinc-400 dark:text-zinc-700" />
                  )}
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full border-2 border-white dark:border-zinc-950 text-white shadow-lg">
                  <Camera className="w-4 h-4" />
                </div>
                <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-white mt-4">{fullName || "Usuário"}</h2>
              <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
                <Mail className="w-4 h-4" /> {user?.email}
              </p>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            {/* Seções do Formulário */}
            <div className="bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <User className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Dados Pessoais</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-widest">Nome</label>
                  <input value={fullName} onChange={(e) => setFullName(e.target.value)} type="text" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-widest">Telefone</label>
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="(00) 00000-0000" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl p-6 border border-zinc-200 dark:border-white/5">
              <div className="flex items-center gap-2 text-amber-500 mb-4">
                <Palette className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Aparência</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "light", icon: Sun, label: "Claro" },
                  { id: "dark", icon: Moon, label: "Escuro" },
                  { id: "system", icon: Monitor, label: "Auto" }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => applyTheme(t.id as any)}
                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border transition-all ${theme === t.id ? "bg-white dark:bg-zinc-800 text-indigo-600 dark:text-white border-zinc-300 dark:border-white/20 shadow-lg" : "bg-white/50 dark:bg-zinc-900/50 border-zinc-200 dark:border-white/5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"}`}
                  >
                    <t.icon className="w-5 h-5" />
                    <span className="text-[10px] font-bold uppercase tracking-tighter">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-indigo-500 mb-2">
                <Bell className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Notificações do Sistema</span>
              </div>
              {isPushSupported ? (
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={isPushProcessing}
                  className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${subscription ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-white dark:bg-zinc-950 border-zinc-200 dark:border-white/10 text-zinc-600 dark:text-zinc-400"}`}
                >
                  <div className="flex items-center gap-3">
                    {subscription ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
                    <div className="flex flex-col items-start">
                      <span className="text-sm font-bold">{subscription ? "Notificações Ativas" : "Ativar Notificações"}</span>
                      <span className="text-[9px] uppercase tracking-wider opacity-60">Alertas no celular</span>
                    </div>
                  </div>
                  {isPushProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : subscription ? <CheckCircle2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </button>
              ) : (
                <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-950 border border-zinc-200 dark:border-white/5 text-zinc-500 text-xs italic">
                  Notificações Push exigem conexão segura (HTTPS).
                </div>
              )}
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 space-y-4">
              <div className="flex items-center gap-2 text-emerald-500 mb-2">
                <Lock className="w-4 h-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Segurança</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-widest">Nova Senha</label>
                  <input value={newPassword} onChange={(e) => setNewPassword(e.target.value)} type="password" placeholder="••••••" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-zinc-500 ml-1 uppercase tracking-widest">Confirmar</label>
                  <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" placeholder="••••••" className="w-full bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-3.5 px-5 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none" />
                </div>
              </div>
            </div>

            <div className="bg-zinc-50 dark:bg-zinc-900/20 rounded-3xl p-6 border border-zinc-200 dark:border-white/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <MapPin className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Localização no Mapa</span>
                </div>
                <button type="button" onClick={() => setLocationEnabled(!locationEnabled)} className={`w-10 h-5 rounded-full transition-colors relative ${locationEnabled ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-800"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${locationEnabled ? "left-6" : "left-1"}`} />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="w-4 h-4 text-zinc-400 dark:text-zinc-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Vibração & Buzina</span>
                </div>
                <button type="button" onClick={() => setAllowNotifications(!allowNotifications)} className={`w-10 h-5 rounded-full transition-colors relative ${allowNotifications ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-800"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${allowNotifications ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in zoom-in-95 ${message.includes("Erro") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button disabled={isSaving} type="submit" className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Configurações</>}
              </button>
              <button type="button" onClick={handleLogout} className="w-full py-4 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/5 active:scale-95">
                <LogOut className="w-5 h-5" /> Sair da Conta
              </button>
            </div>
          </form>

          <footer className="pt-8 flex flex-col items-center gap-2 opacity-40">
            <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500">
              <Link href="/privacy" className="hover:text-indigo-500">Privacidade</Link>
              <Link href="/terms" className="hover:text-indigo-500">Termos</Link>
            </div>
            <p className="text-[9px] text-zinc-400 dark:text-zinc-600 uppercase font-bold tracking-widest">Lista Pronta v1.0.0</p>
          </footer>
        </div>
      )}
    </main>
  )
}

function CheckCircle2(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c5.523 0 9-4.477 9-10S17.523 2 12 2 3 6.477 3 12s3.477 10 9 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}

function ChevronRight(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m9 18 6-6-6-6" />
    </svg>
  )
}
