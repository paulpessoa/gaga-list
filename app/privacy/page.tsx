"use client"

import { ArrowLeft, Shield } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 p-8 md:p-24 max-w-4xl mx-auto">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/" className="p-2 rounded-full hover:bg-zinc-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Política de Privacidade</h1>
      </header>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. Coleta de Dados</h2>
          <p>O <strong>Lista Pronta</strong> coleta apenas as informações necessárias para o funcionamento da plataforma colaborativa: seu nome, e-mail, foto de perfil e localização (apenas se ativada explicitamente por você para uso no recurso “Cadê tu?”).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. Uso da Localização</h2>
          <p>Sua geolocalização é processada em tempo real via Supabase Realtime e compartilhada apenas com os colaboradores das listas que você participa. Nós não armazenamos histórico de trilhas ou localizações passadas em nosso banco de dados permanente.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. Segurança</h2>
          <p>Utilizamos a infraestrutura do Supabase (PostgreSQL) com criptografia de ponta e políticas de segurança de nível de linha (RLS) para garantir que apenas pessoas autorizadas acessem suas listas.</p>
        </section>

        <section className="pt-12 border-t border-white/5 text-sm text-zinc-500 text-center">
          Última atualização: 19 de Março de 2026.
        </section>
      </div>
    </main>
  )
}
