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
  Eye,
  EyeOff,
  Fingerprint
} from "lucide-react"
import dynamic from "next/dynamic"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"

import { createClient } from "@/lib/supabase/client"

// Carrega o Lottie dinamicamente
const LottieFooter = dynamic(() => import("@/components/ui/lottie-footer"), {
  ssr: false
})

function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true)
      }
    }, 100)

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', handler)
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') setDeferredPrompt(null)
  }

  if (isInstalled || !deferredPrompt) return null

  return (
    <div className="fixed bottom-24 right-6 z-50 animate-in slide-in-from-bottom-4 duration-500">
      <button onClick={handleInstall} className="flex items-center gap-3 px-6 py-4 bg-zinc-900 dark:bg-white text-white dark:text-black rounded-[1.5rem] border border-white/10 dark:border-none font-bold text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all animate-bounce">
        <Download className="w-4 h-4" /> Instalar App Nativo
      </button>
    </div>
  )
}

export default function LandingPage() {
  const router = useRouter()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [authMode, setAuthMode] = useState<"magic_link" | "password_login" | "password_signup" | "password_reset">("magic_link")
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const supabase = createClient()

  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const pendingToken = localStorage.getItem("pending_invite_token")
        if (pendingToken) {
          router.replace(`/join/${pendingToken}`)
        } else {
          router.replace("/dashboard")
        }
      }
    }
    checkUser()

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
        const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: redirectUrl } })
        if (error) throw error
        setMessage("Link enviado! Verifique seu e-mail.")
      } else if (authMode === "password_login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        
        const pendingToken = localStorage.getItem("pending_invite_token")
        if (pendingToken) {
          router.push(`/join/${pendingToken}`)
        } else {
          window.location.href = "/dashboard"
        }
      } else if (authMode === "password_signup") {
        const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: redirectUrl } })
        if (error) throw error
        setMessage("Cadastro realizado! Verifique seu e-mail.")
      } else if (authMode === "password_reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${appUrl}/api/auth/confirm?next=/dashboard/profile` })
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
    if (!('credentials' in navigator)) {
      alert('Seu dispositivo não suporta autenticação biométrica neste navegador.')
      return
    }
    alert('Biometria em desenvolvimento: Para ativar o login 100% digital, acesse as Configurações após o primeiro login com senha.')
  }

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden bg-white dark:bg-zinc-950 transition-colors duration-300">
      <InstallPrompt />

      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-600/10 dark:bg-indigo-600/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-600/5 dark:bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

      <nav className="w-full p-6 flex justify-between items-center z-10 max-w-7xl mx-auto border-b border-zinc-100 dark:border-white/5">
        <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-50">
          <ShoppingCart className="w-6 h-6 text-indigo-500" />
          <span className="font-bold text-xl tracking-tight">Lista Pronta</span>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 z-10 mt-16 md:mt-24">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-100 dark:bg-white/5 border border-zinc-200 dark:border-white/10 text-xs font-medium text-indigo-600 dark:text-indigo-300 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          <span>Sincronização em tempo real nativa</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-zinc-900 dark:text-transparent dark:bg-clip-text dark:bg-gradient-to-br dark:from-zinc-100 dark:to-zinc-500 max-w-4xl mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100 leading-tight">
          Suas compras em <br className="hidden md:block" />
          <span className="text-indigo-500 text-6xl md:text-8xl">perfeita sintonia.</span>
        </h1>

        <p className="text-lg md:text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
          Crie, compartilhe e sincronize listas de compras com sua família e
          amigos. Funciona offline, atualiza na velocidade da luz.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
          <button onClick={() => { setAuthMode("magic_link"); setIsModalOpen(true); }} className="px-8 py-4 text-base font-semibold bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-white rounded-full transition-transform hover:scale-105 flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95">
            Acessar minhas listas
          </button>
        </div>

        <div className="mt-24 w-full max-w-5xl bg-zinc-50 dark:bg-zinc-900/40 border border-zinc-200 dark:border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-500">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-10 text-left">
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-sm">
                <Users className="w-7 h-7 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Colaboração Real</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">Convide qualquer pessoa para editar a lista com você. Veja tudo em tempo real.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-sm">
                <Zap className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Offline-First</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">Sem internet? Sem problemas. O app funciona offline e sincroniza depois.</p>
            </div>
            <div className="flex flex-col gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-sm">
                <ShieldCheck className="w-7 h-7 text-rose-400" />
              </div>
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Segurança Staff</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">Proteção de dados em nível bancário. Suas listas são privadas e seguras.</p>
            </div>
          </div>
        </div>

        <div className="mt-20 mb-8 flex gap-8 z-10 opacity-60">
          <Link href="/privacy" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
            <Shield className="w-3.5 h-3.5" /> Privacidade
          </Link>
          <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400 hover:text-indigo-500 transition-colors flex items-center gap-2">
            <FileText className="w-3.5 h-3.5" /> Termos
          </Link>
        </div>
      </main>

      <LottieFooter />

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-zinc-900 w-full max-w-md rounded-[2.5rem] p-10 relative shadow-2xl border border-zinc-200 dark:border-white/10 animate-in zoom-in-95 duration-200">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-8 right-8 text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors">
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 tracking-tight">Acessar</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-sm mb-8 font-medium">Sincronize suas compras em segundos.</p>

            <div className="flex bg-zinc-100 dark:bg-zinc-950 p-1.5 rounded-2xl mb-8 border border-zinc-200 dark:border-white/5">
              <button onClick={() => setAuthMode("magic_link")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${authMode === "magic_link" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-700"}`}>Magic Link</button>
              <button onClick={() => setAuthMode("password_login")} className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${authMode !== "magic_link" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-lg" : "text-zinc-500 hover:text-zinc-700"}`}>Senha</button>
            </div>

            <form onSubmit={handleAuth} className="flex flex-col gap-4">
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <input type="email" placeholder="Seu e-mail" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
              </div>

              {(authMode === "password_login" || authMode === "password_signup") && (
                <div className="relative">
                  <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                  <input type={showPassword ? "text" : "password"} placeholder="Sua senha" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-white/10 rounded-2xl py-4 pl-12 pr-12 text-zinc-900 dark:text-white focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-indigo-500 transition-colors">
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between px-2 mb-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <div className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${rememberMe ? "bg-indigo-500 border-indigo-500" : "border-zinc-300 dark:border-zinc-700"}`}>
                    {rememberMe && <X className="w-3 h-3 text-white" />}
                  </div>
                  <input type="checkbox" className="hidden" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-zinc-300">Lembrar-me</span>
                </label>
                {authMode === "password_login" && (
                  <button type="button" onClick={() => setAuthMode("password_reset")} className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 hover:text-indigo-400 transition-colors">Esqueceu a senha?</button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button type="submit" disabled={isLoading} className="w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-[1.5rem] font-bold text-sm uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-xl shadow-indigo-500/20 active:scale-95">
                  {isLoading ? "Aguarde..." : authMode === "magic_link" ? "Enviar Link" : authMode === "password_login" ? "Entrar" : authMode === "password_reset" ? "Recuperar" : "Criar Conta"}
                </button>
                <button type="button" onClick={handleBiometricAuth} className="w-full py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 rounded-[1.5rem] font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all">
                  <Fingerprint className="w-4 h-4 text-indigo-500" /> Acessar com Digital
                </button>
              </div>

              {message && (
                <div className={`p-4 rounded-2xl text-xs font-bold text-center mt-4 ${message.includes("Erro") ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
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
