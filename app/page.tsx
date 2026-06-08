"use client"

import Link from "next/link"
import {
  Sparkles,
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
  ChevronRight,
  ListChecks
} from "lucide-react"
import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { subscribeUser, unsubscribeUser } from "./actions"
import { createClient } from "@/lib/supabase/client"

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
  const [subscription, setSubscription] = useState<PushSubscription | null>(null)
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
          className="flex items-center gap-2 px-4 py-2 bg-[#53E076]/10 border border-[#53E076]/20 rounded-full text-[10px] font-bold text-[#53E076] backdrop-blur-md transition-all shadow-xl"
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
          className="flex items-center gap-2 px-4 py-2 bg-[#1DB954] border border-[#53E076]/40 rounded-full text-[10px] font-bold text-[#003914] shadow-lg neon-glow-sm active:scale-95 transition-all"
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
      if (isStandalone) setIsInstalled(true)

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
    return () => window.removeEventListener("beforeinstallprompt", handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === "accepted") setDeferredPrompt(null)
  }

  if (isInstalled || !isVisible) return null

  if (deferredPrompt) {
    return (
      <div className="fixed bottom-24 right-6 z-50 flex items-center gap-2 animate-in slide-in-from-bottom-4 duration-500">
        <button
          onClick={handleInstall}
          className="flex items-center gap-3 px-6 py-4 bg-[#201f1f] text-[#e5e2e1] rounded-[1.5rem] border border-[#53E076]/20 font-bold text-xs tracking-wide shadow-2xl neon-glow-sm active:scale-95 transition-all"
        >
          <Download className="w-4 h-4 text-[#53E076]" /> Instalar App
        </button>
        <button
          onClick={() => setIsVisible(false)}
          className="p-4 bg-[#201f1f]/80 backdrop-blur-md text-[#bccbb9] hover:text-[#e5e2e1] rounded-full transition-colors border border-[#3d4a3d]"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (showIOSHint) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 w-[90%] max-w-sm animate-in slide-in-from-top-4 duration-500">
        <div className="glass-premium text-[#e5e2e1] p-4 rounded-2xl shadow-2xl flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#1DB954] flex items-center justify-center flex-shrink-0 neon-glow-sm">
            <Download className="w-5 h-5 text-[#003914]" />
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-bold tracking-wide mb-1 text-[#53E076]">
              Dica Pro:
            </p>
            <p className="text-[11px] leading-tight text-[#bccbb9]">
              Toque em <b className="text-[#e5e2e1]">Compartilhar</b> e depois em{" "}
              <b className="text-[#e5e2e1]">&quot;Adicionar à Tela de Início&quot;</b> para usar como App Nativo.
            </p>
          </div>
          <button
            onClick={() => setShowIOSHint(false)}
            className="p-2 text-[#bccbb9]/60 hover:text-[#bccbb9]"
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
        const { error } = await supabase.auth.signInWithPassword({ email, password })
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
          redirectTo: `${appUrl}/api/auth/confirm?next=/app/update-password`
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

  return (
    <div className="h-dvh flex flex-col relative overflow-hidden bg-[#131313]">
      <InstallPrompt />

      {/* Ambient gradients — Electric Sophistication */}
      <div className="absolute top-[-15%] left-[-15%] w-[500px] h-[500px] bg-[#1DB954]/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-[#7D52FF]/6 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] right-[20%] w-64 h-64 bg-[#00E5FF]/4 rounded-full blur-[80px] pointer-events-none" />

      {/* Nav */}
      <nav className="w-full px-6 py-5 flex justify-between items-center z-10 max-w-7xl mx-auto border-b border-[#3d4a3d]/50">
        <div className="flex items-center gap-2.5 text-[#e5e2e1]">
          {/* GagaList Logo — ListChecks com accent neon */}
          <div className="relative w-8 h-8 flex items-center justify-center">
            <div className="absolute inset-0 bg-[#1DB954]/20 rounded-xl blur-sm" />
            <ListChecks className="w-6 h-6 text-[#53E076] relative z-10" strokeWidth={2} />
          </div>
          <span className="font-extrabold text-xl tracking-tight">
            Gaga<span className="text-[#53E076]">List</span>
          </span>
        </div>

        {/* Badge de status */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#53E076]/8 border border-[#53E076]/20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#53E076] animate-pulse" />
          <span className="text-[10px] font-bold text-[#53E076] uppercase tracking-wider">
            Tempo Real
          </span>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10 py-8">
        <div className="flex-1 flex flex-col items-center justify-center w-full">

          {/* Convite ou badge de feature */}
          {inviteContext ? (
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-sm font-bold text-amber-400 mb-6 animate-slide-up">
              <PartyPopper className="w-5 h-5" />
              <span>Você recebeu um convite para colaborar!</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#53E076]/8 border border-[#53E076]/20 text-xs font-bold text-[#53E076] mb-6 animate-slide-up">
              <Zap className="w-3.5 h-3.5" />
              <span>Sincronização em tempo real</span>
            </div>
          )}

          {/* Headline */}
          <h1 className="text-4xl md:text-7xl font-extrabold tracking-tighter max-w-4xl mb-5 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-tight">
            <span className="text-brand-gradient">Suas compras em</span>
            <br className="hidden md:block" />
            <span
              className="relative"
              style={{
                background: "linear-gradient(135deg, #53E076 0%, #00E5FF 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text"
              }}
            >
              {" "}perfeita sintonia.
            </span>
          </h1>

          {/* Subtítulo */}
          <p className="text-base md:text-lg text-[#bccbb9] max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Crie, compartilhe e sincronize listas de compras com sua família e amigos.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <button
              onClick={() => {
                setAuthMode(inviteContext ? "password_signup" : "magic_link")
                setIsModalOpen(true)
              }}
              className="
                group relative px-10 py-4 text-xs font-black
                bg-[#1DB954] hover:bg-[#53E076] text-[#003914]
                rounded-[1.25rem] transition-all duration-200
                flex items-center justify-center gap-3 cursor-pointer
                shadow-2xl neon-glow
                active:scale-95 hover:scale-105
                overflow-hidden
              "
            >
              {/* shimmer */}
              <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
              {inviteContext ? "Criar conta e entrar na lista" : "Acessar minhas listas"}
              <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2 mt-8 animate-in fade-in duration-700 delay-500">
            {["Multi-usuário", "Offline First", "IA integrada", "PWA"].map((feat) => (
              <span
                key={feat}
                className="px-3 py-1 rounded-full text-[10px] font-bold tracking-wide bg-[#201f1f] border border-[#3d4a3d] text-[#bccbb9]"
              >
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Footer links */}
        <div className="mt-auto py-4 flex gap-8 z-10 opacity-50">
          <Link
            href="/privacy"
            className="text-xs font-bold tracking-wide text-[#bccbb9] hover:text-[#53E076] transition-colors flex items-center gap-2"
          >
            <Shield className="w-3.5 h-3.5" /> Privacidade
          </Link>
          <Link
            href="/terms"
            className="text-xs font-bold tracking-wide text-[#bccbb9] hover:text-[#53E076] transition-colors flex items-center gap-2"
          >
            <FileText className="w-3.5 h-3.5" /> Termos
          </Link>
        </div>
      </main>

      {/* Modal de Autenticação */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="
            bg-[#1c1b1b] w-full h-full sm:h-auto sm:max-w-md
            sm:rounded-[2.5rem] p-8 sm:p-10 relative
            shadow-2xl border-none sm:border sm:border-[#53E076]/10
            animate-in slide-in-from-bottom sm:zoom-in-95 duration-300
          ">
            {/* Glow top */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-px bg-gradient-to-r from-transparent via-[#53E076]/40 to-transparent" />

            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-6 right-6 sm:top-8 sm:right-8 text-[#bccbb9]/50 hover:text-[#e5e2e1] transition-colors p-2"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="mt-8 sm:mt-0">
              {/* Logo mini no modal */}
              <div className="flex items-center gap-2 mb-6">
                <ListChecks className="w-5 h-5 text-[#53E076]" strokeWidth={2} />
                <span className="font-extrabold text-sm text-[#e5e2e1] tracking-tight">
                  Gaga<span className="text-[#53E076]">List</span>
                </span>
              </div>

              <h2 className="text-3xl font-black text-[#e5e2e1] mb-2 tracking-tight">
                {inviteContext ? "Quase lá!" : "Bem-vindo"}
              </h2>
              <p className="text-[#bccbb9] text-sm mb-8 font-medium">
                {inviteContext
                  ? "Crie sua conta para aceitar o convite."
                  : "Acesse suas listas colaborativas."}
              </p>

              {/* Toggle de modo */}
              <div className="flex bg-[#131313] p-1.5 rounded-2xl mb-8 border border-[#3d4a3d]">
                <button
                  onClick={() => setAuthMode("magic_link")}
                  className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-xl transition-all ${
                    authMode === "magic_link"
                      ? "bg-[#53E076]/15 text-[#53E076] border border-[#53E076]/20"
                      : "text-[#bccbb9]/50 hover:text-[#bccbb9]"
                  }`}
                >
                  Magic Link
                </button>
                <button
                  onClick={() => setAuthMode("password_login")}
                  className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-xl transition-all ${
                    authMode !== "magic_link"
                      ? "bg-[#53E076]/15 text-[#53E076] border border-[#53E076]/20"
                      : "text-[#bccbb9]/50 hover:text-[#bccbb9]"
                  }`}
                >
                  Senha
                </button>
              </div>

              {/* Formulário */}
              <form onSubmit={handleAuth} className="flex flex-col gap-4">
                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#bccbb9]/50" />
                  <input
                    type="email"
                    placeholder="Seu e-mail"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    className="w-full input-gaga rounded-2xl py-4 pl-12 pr-4 text-sm"
                  />
                </div>

                {/* Password */}
                {(authMode === "password_login" || authMode === "password_signup") && (
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#bccbb9]/50" />
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Sua senha"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full input-gaga rounded-2xl py-4 pl-12 pr-12 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bccbb9]/50 hover:text-[#53E076] transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                )}

                {/* Lembrar / Esqueceu */}
                <div className="flex items-center justify-between px-2 mb-2">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <div
                      onClick={() => setRememberMe(!rememberMe)}
                      className={`w-4 h-4 rounded border transition-all flex items-center justify-center cursor-pointer ${
                        rememberMe
                          ? "bg-[#53E076] border-[#53E076]"
                          : "border-[#3d4a3d] bg-[#201f1f]"
                      }`}
                    >
                      {rememberMe && <X className="w-3 h-3 text-[#003914]" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={rememberMe}
                      onChange={() => setRememberMe(!rememberMe)}
                    />
                    <span className="text-[10px] font-bold tracking-wide text-[#bccbb9]/60 group-hover:text-[#bccbb9] transition-colors">
                      Lembrar-me
                    </span>
                  </label>
                  {authMode === "password_login" && (
                    <button
                      type="button"
                      onClick={() => setAuthMode("password_reset")}
                      className="text-[10px] font-bold tracking-wide text-[#bccbb9]/50 hover:text-[#53E076] transition-colors"
                    >
                      Esqueceu a senha?
                    </button>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="
                    w-full py-5 bg-[#1DB954] hover:bg-[#53E076]
                    text-[#003914] rounded-[1.5rem]
                    font-black text-sm tracking-wide
                    transition-all disabled:opacity-40
                    shadow-xl neon-glow
                    active:scale-95 hover:scale-[1.02]
                  "
                >
                  {isLoading
                    ? "Aguarde..."
                    : authMode === "magic_link"
                    ? "Receber Link"
                    : authMode === "password_login"
                    ? "Entrar"
                    : authMode === "password_reset"
                    ? "Recuperar Senha"
                    : "Criar Conta"}
                </button>

                {/* Mensagem de feedback */}
                {message && (
                  <div
                    className={`p-4 rounded-2xl text-xs font-bold text-center mt-2 ${
                      message.toLowerCase().includes("erro") || message.toLowerCase().includes("error")
                        ? "bg-[#93000a]/20 text-[#ffb4ab] border border-[#ffb4ab]/20"
                        : "bg-[#53E076]/10 text-[#53E076] border border-[#53E076]/20"
                    }`}
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
        <div className="min-h-screen bg-[#131313] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-2xl bg-[#1DB954]/20 flex items-center justify-center neon-pulse">
              <ListChecks className="w-6 h-6 text-[#53E076]" />
            </div>
            <Loader2 className="w-6 h-6 animate-spin text-[#53E076]/60" />
          </div>
        </div>
      }
    >
      <LandingContent />
    </Suspense>
  )
}
