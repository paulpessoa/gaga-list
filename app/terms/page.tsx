"use client"

import { ArrowLeft, FileText } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 p-8 md:p-24 max-w-4xl mx-auto">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/" className="p-2 rounded-full hover:bg-zinc-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-bold text-white tracking-tight">Termos de Uso</h1>
      </header>

      <div className="space-y-8 leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-white mb-4">1. Uso Aceitável</h2>
          <p>O <strong>Lista Pronta</strong> é uma ferramenta para organização de compras. O usuário compromete-se a não utilizar a plataforma para fins ilícitos, spam ou assédio através das ferramentas colaborativas.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">2. Colaboração</h2>
          <p>Ao convidar um colaborador para sua lista, você concede a ele permissões de edição e visualização. A responsabilidade pelo conteúdo das listas é integralmente dos seus participantes.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-white mb-4">3. Modificações</h2>
          <p>Reservamo-nos o direito de atualizar estes termos e as funcionalidades do aplicativo para melhorar a experiência do usuário.</p>
        </section>

        <section className="pt-12 border-t border-white/5 text-sm text-zinc-500 text-center">
          Última atualização: 19 de Março de 2026.
        </section>
      </div>
    </main>
  )
}
