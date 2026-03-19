"use client"

import Link from "next/link"
import {
  ShoppingCart,
  Users,
  Zap,
  ShieldCheck,
  X,
  Mail,
  KeyRound,
  Shield,
  FileText,
  Download,
  Bell,
  BellOff
} from "lucide-react"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { subscribeUser, unsubscribeUser, sendNotification } from './actions'

import { createClient } from "@/lib/supabase/client"

// Carrega o Lottie dinamicamente
const LottieFooter = dynamic(() => import("@/components/ui/lottie-footer"), {
  ssr: false
})

// Função auxiliar conforme documentação Next.js
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
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
  const [message, setMessage] = useState('')

  useEffect(() => {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true)
      registerServiceWorker()
    }
  }, [])

  async function registerServiceWorker() {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none',
    })
    const sub = await registration.pushManager.getSubscription()
    setSubscription(sub)
  }

  async function subscribeToPush() {
    const registration = await navigator.serviceWorker.ready
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(
        process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BCZ...sua_chave_publica_aqui'
      ),
    })
    setSubscription(sub)
    await subscribeUser(sub)
  }

  async function unsubscribeFromPush() {
    await subscription?.unsubscribe()
    setSubscription(null)
    await unsubscribeUser()
  }

  if (!isSupported) return null

  return (
    <div className="fixed top-24 left-6 z-50 animate-in slide-in-from-left-4 duration-500">
      {subscription ? (
        <button
          onClick={unsubscribeFromPush}
          className="flex items-center gap-2 px-4 py-2 bg-zinc-900/80 border border-white/10 rounded-full text-[10px] font-bold text-zinc-400 hover:text-white backdrop-blur-md transition-all"
        >
          <BellOff className="w-3.5 h-3.5" /> Notificações Ativas
        </button>
      ) : (
        <button
          onClick={subscribeToPush}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 border border-indigo-400 rounded-full text-[10px] font-bold text-white shadow-lg shadow-indigo-500/20 active:scale-95 transition-all"
        >
          <Bell className="w-3.5 h-3.5" /> Ativar Notificações
        </button>
      )}
    </div>
  )
}

function InstallPrompt() {
  const [isStandalone, setIsSupported] = useState(false)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches
    ) {
      setIsSupported(true)
    }

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
    })
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setDeferredPrompt(null)
    }
  }

  if (isStandalone || !deferredPrompt) return null

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <button
        onClick={handleInstall}
        className="flex items-center gap-3 px-6 py-4 bg-white text-black rounded-[1.5rem] font-bold text-xs uppercase tracking-widest shadow-2xl shadow-white/5 active:scale-95 transition-all border-none"
      >
        <Download className="w-4 h-4" /> Instalar App Nativo
      </button>
    </div>
  )
}

export default function LandingPage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [authMode, setAuthMode] = useState<
    "magic_link" | "password_login" | "password_signup" | "password_reset"
  >("magic_link")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    try {
      const appUrl = window.location.origin
      const redirectUrl = `${appUrl}/api/auth/confirm`

      if (authMode === "magic_link") {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectUrl }
        })
        if (error) throw error
        setMessage("Link mágico enviado! Verifique seu e-mail.")
      } else if (authMode === "password_login") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        })
        if (error) throw error
        window.location.href = "/dashboard"
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
          redirectTo: `${appUrl}/api/auth/confirm?next=/dashboard/profile`
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
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-zinc-950">
      <PushNotificationManager />
      <InstallPrompt />

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <nav className="w-full p-6 flex justify-between items-center z-10 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 text-zinc-50">
          <ShoppingCart className="w-6 h-6 text-indigo-400" />
          <span className="font-bold text-xl tracking-tight">Lista Pronta</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10 mt-16 md:mt-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-panel text-xs font-medium text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Sincronização em tempo real nativa</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-zinc-100 to-zinc-500 max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-tight">
          Suas compras em <br className="hidden md:block" />
          <span className="text-indigo-400 text-6xl md:text-8xl">perfeita sintonia.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-400 max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Crie, compartilhe e sincronize listas de compras com sua família e
          amigos. Funciona offline, atualiza na velocidade da luz e protege seus
          dados.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <button
            onClick={() => {
              setAuthMode("magic_link")
              setIsModalOpen(true)
            }}
            className="px-8 py-4 text-base font-semibold bg-zinc-100 text-zinc-900 hover:bg-white rounded-full transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
          >
            Acessar minhas listas
          </button>
        </div>

        <div className="mt-24 w-full max-w-5xl glass-panel rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                <Users className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100">Colaboração Real</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Convide qualquer pessoa para editar a lista com você. Veja os itens sendo marcados em tempo real na sua tela.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100">Offline-First</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Sem internet no supermercado? Sem problemas. O app funciona offline e sincroniza tudo automaticamente.</p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/20 flex items-center justify-center border border-rose-500/30 shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                <ShieldCheck className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-100">Segurança Staff</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">Arquitetura blindada. O frontend nunca acessa o banco diretamente. Seus dados protegidos por rotas de API seguras.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 mb-8 flex gap-8 z-10 opacity-40 hover:opacity-100 transition-opacity">
          <Link href="/privacy" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Privacidade
          </Link>
          <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Termos
          </Link>
        </div>
      </main>

      <LottieFooter />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-md rounded-3xl p-8 relative shadow-2xl border border-white/10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 text-zinc-400 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>

            <h2 className="text-2xl font-bold text-white mb-2">Bem-vindo</h2>
            <p className="text-zinc-400 text-sm mb-6">Acesse suas listas de compras colaborativas.</p>

            <div className="flex bg-zinc-900/50 p-1 rounded-xl mb-6 border border-white/5">
              <button onClick={() => setAuthMode("magic_link")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${authMode === "magic_link" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}>Magic Link</button>
              <button onClick={() => setAuthMode("password_login")} className={`flex-1 py-2 text-sm font-medium rounded-lg transition-colors ${authMode !== "magic_link" ? "bg-zinc-800 text-white shadow-sm" : "text-zinc-400 hover:text-zinc-200"}`}>Senha</button>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input type="email" placeholder="Seu e-mail" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
              </div>

              {(authMode === "password_login" || authMode === "password_signup") && (
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                  <input type="password" placeholder="Sua senha" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50" />
                </div>
              )}

              {authMode === "password_login" && (
                <div className="flex justify-end">
                  <button type="button" onClick={() => setAuthMode("password_reset")} className="text-xs text-zinc-400 hover:text-white transition-colors">Esqueceu a senha?</button>
                </div>
              )}

              <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2 shadow-xl shadow-indigo-500/20 active:scale-95">
                {isLoading ? "Aguarde..." : authMode === "magic_link" ? "Enviar Magic Link" : authMode === "password_login" ? "Entrar" : authMode === "password_reset" ? "Recuperar Senha" : "Criar Conta"}
              </button>

              <div className="text-center mt-2 flex flex-col gap-2">
                {authMode !== "magic_link" && authMode !== "password_reset" && (
                  <button type="button" onClick={() => setAuthMode(authMode === "password_login" ? "password_signup" : "password_login")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">
                    {authMode === "password_login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Faça login"}
                  </button>
                )}
                {authMode === "password_reset" && (
                  <button type="button" onClick={() => setAuthMode("password_login")} className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors">Voltar para o login</button>
                )}
              </div>

              {message && (
                <div className={`p-3 rounded-xl text-sm text-center ${message.includes("Erro") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                  {message}
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
