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
import type { Database } from "@/types/database.types"

type ProfileUpdate = Database["public"]["Tables"]["profiles"]["Update"]

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
    // Carregar preferência de tema do localStorage
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | "system"
    if (savedTheme) setTheme(savedTheme)

    if (user) {
      const metadata = user.user_metadata as { full_name?: string }
      setFullName(metadata?.full_name || "")

      const fetchProfile = async () => {
        try {
          const { data, error } = await (supabase
            .from("profiles") as any)
            .select("*")
            .eq("id", user.id)
            .maybeSingle()

          if (error) throw error

          const profile = data as Database["public"]["Tables"]["profiles"]["Row"] | null

          if (profile) {
            setAvatarUrl(profile.avatar_url)
            setLocationEnabled(!!profile.location_enabled)
            setPhone(profile.phone || "")
            setAllowNotifications(!!profile.allow_notifications)
          }
        } catch (err) {
          console.error("Erro ao carregar perfil:", err)
        }
      }
      fetchProfile()
    }
  }, [user, supabase])

  const applyTheme = (newTheme: "light" | "dark" | "system") => {
    setTheme(newTheme)
    localStorage.setItem("theme", newTheme)
    
    const root = window.document.documentElement
    if (newTheme === "dark") {
      root.classList.add("dark")
    } else if (newTheme === "light") {
      root.classList.remove("dark")
    } else {
      // Modo Sistema
      const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (systemDark) {
        root.classList.add("dark")
      } else {
        root.classList.remove("dark")
      }
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

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const {
        data: { publicUrl }
      } = supabase.storage.from("avatars").getPublicUrl(filePath)

      const publicUrlWithTimestamp = `${publicUrl}?t=${Date.now()}`

      const { error: updateError } = await (supabase
        .from("profiles") as any)
        .update({ avatar_url: publicUrlWithTimestamp })
        .eq("id", user.id)

      if (updateError) throw updateError

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
      // 1. Atualizar Perfil
      const updateData: ProfileUpdate = {
        full_name: fullName,
        location_enabled: locationEnabled,
        phone: phone,
        allow_notifications: allowNotifications
      }

      const { error: profileError } = await (supabase
        .from("profiles") as any)
        .update(updateData)
        .eq("id", user.id)

      if (profileError) throw profileError

      // 2. Atualizar Senha (se preenchida)
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          throw new Error("As senhas não coincidem")
        }
        if (newPassword.length < 6) {
          throw new Error("A senha deve ter no mínimo 6 caracteres")
        }
        const { error: passwordError } = await supabase.auth.updateUser({
          password: newPassword
        })
        if (passwordError) throw passwordError
        setNewPassword("")
        setConfirmPassword("")
      }

      await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

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
        <Link
          href="/dashboard"
          className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500 dark:text-zinc-400"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white leading-tight">
          Configurações
        </h1>
      </header>

      {userLoading ? (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-8 animate-pulse flex flex-col items-center gap-4 border border-zinc-200 dark:border-white/5">
          <div className="w-24 h-24 rounded-full bg-zinc-200 dark:bg-zinc-800/50"></div>
          <div className="w-48 h-6 bg-zinc-200 dark:bg-zinc-800/50 rounded-md"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Avatar & Info */}
          <div className="bg-zinc-50 dark:bg-zinc-950/40 rounded-3xl p-8 border border-zinc-200 dark:border-white/5 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
            
            <div className="relative z-10 flex flex-col items-center">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-white dark:border-zinc-900 shadow-2xl bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Sua foto de perfil" className="w-full h-full object-cover" />
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
            {/* Seção Perfil */}
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

            {/* Seção Tema */}
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

            {/* Seção Segurança */}
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

            {/* Seção Permissões */}
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
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Buzinadas e Avisos</span>
                </div>
                <button type="button" onClick={() => setAllowNotifications(!allowNotifications)} className={`w-10 h-5 rounded-full transition-colors relative ${allowNotifications ? "bg-indigo-500" : "bg-zinc-300 dark:bg-zinc-800"}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${allowNotifications ? "left-6" : "left-1"}`} />
                </button>
              </div>
            </div>

            {message && (
              <div className={`p-4 rounded-2xl text-xs font-bold text-center animate-in fade-in zoom-in-95 ${message.includes("Erro") ? "bg-red-500/10 text-red-500 border border-red-500/20" : "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"}`}>
                {message}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button disabled={isSaving} type="submit" className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center justify-center gap-2 active:scale-95">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Salvar Configurações</>}
              </button>
              <button type="button" onClick={handleLogout} className="w-full py-4 bg-zinc-100 dark:bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-500 text-zinc-500 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-zinc-200 dark:border-white/5 active:scale-95">
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
