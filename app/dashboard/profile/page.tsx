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
  Phone
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

  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [locationEnabled, setLocationEnabled] = useState(false)
  const [allowNotifications, setAllowNotifications] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
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
          } else {
            await (supabase.from("profiles") as any).upsert({
              id: user.id,
              email: user.email || "",
              full_name: metadata?.full_name || "",
              location_enabled: false,
              allow_notifications: true
            })
          }
        } catch (err) {
          console.error("Erro ao carregar perfil:", err)
        }
      }
      fetchProfile()
    }
  }, [user, supabase])

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

      const updateData: ProfileUpdate = { 
        avatar_url: publicUrlWithTimestamp 
      }

      const { error: updateError } = await (supabase
        .from("profiles") as any)
        .update(updateData)
        .eq("id", user.id)

      if (updateError) throw updateError

      setAvatarUrl(publicUrlWithTimestamp)
      setMessage("Foto de perfil atualizada!")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido"
      setMessage(`Erro no upload: ${msg}`)
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
        allow_notifications: allowNotifications
      }

      const { error } = await (supabase
        .from("profiles") as any)
        .update(updateData)
        .eq("id", user.id)

      if (error) throw error

      await supabase.auth.updateUser({
        data: { full_name: fullName }
      })

      setMessage("Configurações salvas!")
      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Erro desconhecido"
      setMessage(`Erro ao salvar: ${msg}`)
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
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32">
      <header className="flex items-center gap-4">
        <Link
          href="/dashboard"
          className="p-2 rounded-full hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-100"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-2xl font-bold tracking-tight text-white">
          Configurações
        </h1>
      </header>

      {userLoading ? (
        <div className="glass-panel rounded-2xl p-8 animate-pulse flex flex-col items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-zinc-800/50"></div>
          <div className="w-48 h-6 bg-zinc-800/50 rounded-md"></div>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl p-8 md:p-10 border border-white/5 shadow-2xl relative overflow-hidden bg-zinc-950/40 backdrop-blur-xl">
          <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
          
          <div className="relative z-10 flex flex-col items-center mb-10">
            <div
              className="relative group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-zinc-900 shadow-2xl bg-zinc-900 flex items-center justify-center">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-12 h-12 text-zinc-700" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                  </div>
                )}
              </div>
              <div className="absolute bottom-0 right-0 p-2 bg-indigo-500 rounded-full border-2 border-zinc-950 text-white shadow-lg group-hover:scale-110 transition-transform">
                <Camera className="w-4 h-4" />
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarUpload}
                className="hidden"
                accept="image/*"
              />
            </div>
            <h2 className="text-xl font-bold text-white mt-4">
              {fullName || "Usuário"}
            </h2>
            <p className="text-zinc-500 text-sm flex items-center gap-2 mt-1">
              <Mail className="w-4 h-4" />
              {user?.email}
            </p>
          </div>

          <form onSubmit={handleSave} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                  Nome Completo
                </label>
                <input 
                  type="text" 
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 ml-1">
                  WhatsApp / Telefone
                </label>
                <input 
                  type="tel" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 px-5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 leading-tight">
                      Geolocalização
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Aparecer no mapa "Cadê tu?"
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setLocationEnabled(!locationEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${locationEnabled ? "bg-indigo-500" : "bg-zinc-800"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${locationEnabled ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100 leading-tight">
                      Vibração & Sino
                    </h3>
                    <p className="text-[11px] text-zinc-500">
                      Permitir que te chamem na loja.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAllowNotifications(!allowNotifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${allowNotifications ? "bg-indigo-500" : "bg-zinc-800"}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowNotifications ? "translate-x-6" : "translate-x-1"}`}
                  />
                </button>
              </div>
            </div>

            {message && (
              <div
                className={`p-4 rounded-2xl text-sm text-center font-bold animate-in fade-in zoom-in-95 ${message.includes("Erro") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
              >
                {message}
              </div>
            )}

            <div className="flex flex-col gap-4">
              <button
                type="submit"
                disabled={isSaving}
                className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 active:scale-[0.98] text-white rounded-2xl font-bold transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" /> Salvar Configurações
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full py-4 bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-400 text-zinc-500 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 border border-white/5"
              >
                <LogOut className="w-5 h-5" /> Sair da Conta
              </button>
            </div>
          </form>
        </div>
      )}
    </main>
  )
}
