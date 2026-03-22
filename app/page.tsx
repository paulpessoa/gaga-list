"use client"

import Link from "next/link"
import {
  ShoppingCart,
  Zap,
  X,
  Mail,
  KeyRound,
  Shield,
  FileText,
  Download,
  Bell,
  BellOff,
  Eye,
  EyeOff,
  Loader2,
  PartyPopper,
  ChevronRight
} from "lucide-react"
import dynamic from "next/dynamic"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { subscribeUser, unsubscribeUser } from "./actions"

import { createClient } from "@/lib/supabase/client"

// Carrega o Lottie dinamicamente
const LottieFooter = dynamic(() => import("@/components/ui/lottie-footer"), {
  ssr: false
})

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

function PushNotificationManager() {
  const [isSupported, setIsSupported] = useState(false)
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null
  )
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      setIsSupported(true)
      navigator.serviceWorker.ready.then((registration) => {
        registration.pushManager
          .getSubscription()
          .then((sub) => setSubscription(sub))
      })
    }
  }, [])

  async function subscribeToPush() {
    setIsProcessing(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
      if (!vapidPublicKey) throw new Error("Chave VAPID ausente")

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })
      setSubscription(sub)
      await subscribeUser(sub)
    } catch (err: any) {
      console.error("Erro ao assinar push:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  async function unsubscribeFromPush() {
    setIsProcessing(true)
    try {
      await subscription?.unsubscribe()
      setSubscription(null)
      await unsubscribeUser()
    } catch (err) {
      console.error("Erro ao cancelar push:", err)
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isSupported) return null

  return (
    <div className="fixed top-24 left-6 z-50 animate-in slide-in-from-left-4 duration-500">
      {subscription ? (
        <button
          onClick={unsubscribeFromPush}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-[10px] font-bold text-emerald-500 backdrop-blur-md transition-all shadow-xl"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <BellOff className="w-3.5 h-3.5" />
          )}{" "}
          Notificações Ativas
        </button>
      ) : (
        <button
          onClick={subscribeToPush}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 border border-indigo-400 rounded-full text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          {isProcessing ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Bell className="w-3.5 h-3.5" />
          )}{" "}
          Ativar Notificações
        </button>
      )}
    </div>
  )
}

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)
  const [showIOSHint, setShowIOSHint] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    requestAnimationFrame(() => {
      const isStandalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone
      if (isStandalone) {
        setIsInstalled(true)
      }

      const isIOS =
        /iPad|iPhone|iPod/.test(navigator.userAgent) &&
        !(window as any).MSStream
      if (isIOS && !window.matchMedia("(display-mode: standalone)").matches) {
        setShowIOSHint(true)
      }
    })

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setDeferredPrompt(null)
  }

  if (isInstalled || !isVisible) return null

  // UI para Android/Chrome
  if (deferredPrompt) {
    return (
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={handleInstall}
          className="flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] border border-white/10 dark:border-none font-bold text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all"
        >
          <Download className="w-4 h-4" /> Instalar App
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-4 bg-zinc-900/10 dark:bg-white/10 backdrop-blur-md text-zinc-500 hover:text-zinc-900 dark:hover:text-white rounded-full transition-colors border border-zinc-200 dark:border-white/10"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  // UI para iOS (Banner discreto no topo)
  if (showIOSHint) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-4 duration-500">
        <div className="bg-zinc-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-black p-4 rounded-2xl shadow-2xl border border-white/10 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center flex-shrink-0">
            <Download className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold uppercase tracking-wider mb-1">
              Dica de Staff:
            </p>
            <p className="text-[11px] leading-tight opacity-80">
              Toque em <b>Compartilhar</b> e depois em{" "}
              <b>&quot;Adicionar Ã Tela de InÃ­cio&quot;</b> para usar como App
              Nativo.
            </p>
          </div>
          <button
            onClick={() => setShowIOSHint(false)}
            className="p-2 opacity-50 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    )
  }

  return null
}

function LandingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [authMode, setAuthMode] = useState<
    "magic_link" | "password_login" | "password_signup" | "password_reset"
  >("password_login")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [inviteContext, setInviteContext] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    const checkUserAndInvite = async () => {
      const pendingToken = localStorage.getItem("pending_invite_token")
      if (pendingToken) setInviteContext(true)

      const {
        data: { user }
      } = await supabase.auth.getUser()
      if (user) {
        if (pendingToken) {
          router.replace(`/join/${pendingToken}`)
        } else {
          router.replace("/app")
        }
      }
    }
    checkUserAndInvite()

    const savedEmail = localStorage.getItem("remembered_email")
    const savedPassword = localStorage.getItem("remembered_password")
    if (savedEmail) setEmail(savedEmail)
    if (savedPassword) setPassword(savedPassword)
  }, [supabase.auth, router])

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    if (rememberMe) {
      localStorage.setItem("remembered_email", email)
      localStorage.setItem("remembered_password", password)
    } else {
      localStorage.removeItem("remembered_email")
      localStorage.removeItem("remembered_password")
    }

    try {
      const appUrl = window.location.origin
      const redirectUrl = `${appUrl}/api/auth/confirm`

      if (authMode === "magic_link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectUrl }
        })
        if (error) throw error
        setMessage("Link enviado! Verifique seu e-mail.")
      } else if (authMode === "password_login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error

        const pendingToken = localStorage.getItem("pending_invite_token")
        if (pendingToken) {
          router.push(`/join/${pendingToken}`)
        } else {
          window.location.href = "/app"
        }
      } else if (authMode === "password_signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: redirectUrl }
        })
        if (error) throw error
        setMessage("Cadastro realizado! Verifique seu e-mail.")
      } else if (authMode === "password_reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${appUrl}/api/auth/confirm?next=/app/profile`
        })
        if (error) throw error
        setMessage("E-mail de recuperação enviado!")
      }
    } catch (err: any) {
      setMessage(err.message || "Ocorreu um erro.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleBiometricAuth = async () => {
    if (!("credentials" in navigator)) {
      alert(
        "Seu dispositivo não suporta autenticação biométrica neste navegador."
      )
      return
    }
    alert(
      "Biometria em desenvolvimento: Para ativar o login 100% digital, acesse as Configurações após o primeiro login com senha."
    )
  }

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-300">
      <InstallPrompt />

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <nav className="w-full p-6 flex justify-between items-center z-10 max-w-7xl mx-auto border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <ShoppingCart className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight">Lista Pronta</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10 py-4">
        {inviteContext ? (
          <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm font-bold text-amber-600 dark:text-amber-400 mb-4 animate-bounce">
            <PartyPopper className="w-5 h-5" />
            <span>Você recebeu um convite para colaborar!</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <span>Sincronização em tempo real</span>
          </div>
        )}

        <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-zinc-100 dark:to-zinc-500 max-w-4xl mb-4 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-tight">
          Suas compras em <br className="hidden md:block" />
          <span className="text-indigo-500 text-5xl md:text-8xl">
            perfeita sintonia.
          </span>
        </h1>

        <p className="text-base md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-8 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Crie, compartilhe e sincronize listas de compras com sua família e
          amigos.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <button
            onClick={() => {
              setAuthMode(inviteContext ? "password_signup" : "magic_link")
              setIsModalOpen(true)
            }}
            className="px-10 py-4 text-xs font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white rounded-[1.25rem] transition-all hover:scale-105 flex items-center justify-center gap-3 cursor-pointer shadow-2xl shadow-indigo-500/20 active:scale-95"
          >
            {inviteContext
              ? "Criar conta e entrar na lista"
              : "Acessar minhas listas"}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-12 mb-4 flex gap-8 z-10 opacity-60">
          <Link
            href="/privacy"
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5" /> Privacidade
          </Link>
          <Link
            href="/terms"
            className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" /> Termos
          </Link>
        </div>
      </main>

      <LottieFooter />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full h-full sm:h-auto sm:max-w-md sm:rounded-[2.5rem] p-8 sm:p-10 relative shadow-2xl border-none sm:border sm:border-zinc-200 sm:dark:border-white/10 animate-in slide-in-from-bottom sm:zoom-in-95 duration-300">
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mt-8 sm:mt-0">
              <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">
                {inviteContext ? "Quase lá!" : "Bem-vindo"}
              </h2>
              <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 font-medium">
                {inviteContext
                  ? "Crie sua conta para aceitar o convite."
                  : "Acesse suas listas colaborativas."}
              </p>

              <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl mb-8 border border-zinc-200 dark:border-white/5">
                <button
                  onClick={() => setAuthMode("magic_link")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${authMode === "magic_link" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  Magic Link
                </button>
                <button
                  onClick={() => setAuthMode("password_login")}
                  className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${authMode !== "magic_link" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-700"}`}
                >
                  Senha
                </button>
              </div>

              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                  />
                </div>

                {(authMode === "password_login" ||
                  authMode === "password_signup") && (
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-indigo-500 transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between px-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? "bg-indigo-500 border-indigo-500" : "border-zinc-300 dark:border-zinc-700"}`}
                    >
                      {rememberMe && <X className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">
                      Lembrar-me
                    </span>
                  </label>
                  {authMode === "password_login" && (
                    <button
                      type="button"
                      onClick={() => setAuthMode("password_reset")}
                      className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20 active:scale-95"
                  >
                    {isLoading
                      ? "Aguarde..."
                      : authMode === "magic_link"
                        ? "Receber Link"
                        : authMode === "password_login"
                          ? "Entrar"
                          : authMode === "password_reset"
                            ? "Recuperar"
                            : "Criar Conta"}
                  </button>
                </div>

                {message && (
                  <div
                    className={`p-4 rounded-2xl text-xs font-bold text-center mt-4 ${message.includes("Erro") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}
                  >
                    {message}
                  </div>
                )}
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function LandingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  )
}
