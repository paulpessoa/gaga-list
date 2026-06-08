"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { KeyRound, Eye, EyeOff, Loader2, Check } from "lucide-react"
import { useHaptic } from "@/hooks/use-haptic"

export default function UpdatePasswordPage() {
  const supabase = createClient()
  const router = useRouter()
  const { trigger } = useHaptic()

  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [message, setMessage] = useState("")

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || password.length < 6) {
      setMessage("A senha deve ter pelo menos 6 caracteres.")
      return
    }

    setIsUpdating(true)
    trigger("medium")
    setMessage("")

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setMessage("Senha atualizada com sucesso! Redirecionando...")
      trigger("success")
      
      // Espera 2 segundos e manda pro app
      setTimeout(() => {
        router.push("/app")
      }, 2000)
      
    } catch (err: any) {
      setMessage("Erro ao atualizar: " + (err.message || "Tente novamente."))
      console.error(err)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#131313] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md bg-[#1c1b1b] rounded-[2.5rem] p-8 border border-[#53E076]/20 shadow-2xl relative">
        <h1 className="text-2xl font-black text-[#e5e2e1] tracking-tight mb-2 text-center">
          Criar Nova Senha
        </h1>
        <p className="text-sm text-[#bccbb9] text-center mb-8">
          Digite a sua nova senha abaixo para atualizar seu acesso.
        </p>

        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div className="relative">
            <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#bccbb9]/50" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Nova senha (mín. 6 caracteres)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-[#131313] border border-[#3d4a3d] focus:border-[#53E076] rounded-2xl py-4 pl-12 pr-12 text-sm font-bold text-[#e5e2e1] outline-none transition-all"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#bccbb9]/50 hover:text-[#53E076] transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>

          <button
            type="submit"
            disabled={isUpdating}
            className="w-full py-4 mt-4 bg-[#53E076] text-[#003914] hover:bg-[#1DB954] rounded-2xl font-black text-sm tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isUpdating ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5"/> Atualizar Senha</>}
          </button>

          {message && (
            <div className={`p-4 rounded-xl text-xs font-bold text-center mt-2 ${message.includes('sucesso') ? 'bg-[#53E076]/10 text-[#53E076]' : 'bg-rose-500/10 text-rose-500'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
