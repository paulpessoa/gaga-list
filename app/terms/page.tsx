"use client"

import { ArrowLeft, FileText, Users, Brain, ShieldAlert } from "lucide-react"
import Link from "next/link"

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 p-8 md:p-24 max-w-4xl mx-auto pb-32">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/" className="p-2 rounded-full hover:bg-zinc-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black">
          <FileText className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Termos de Uso</h1>
      </header>

      <div className="space-y-12 leading-relaxed">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <FileText className="w-4 h-4 text-indigo-500" />
            <span>1. Uso Aceitável</span>
          </div>
          <p>O <strong>Lista Pronta</strong> é uma plataforma para organização e colaboração de compras. Ao utilizar nossos serviços, você concorda em não utilizar a ferramenta para fins ilícitos, envio de spam através de convites ou assédio através das ferramentas de comunicação integrada.</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <Users className="w-4 h-4 text-emerald-500" />
            <span>2. Colaboração e Convites</span>
          </div>
          <p>Nosso modelo de crescimento é baseado na colaboração. Entenda suas responsabilidades:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Ao convidar um colaborador, você concede permissões de edição sobre seus dados de lista.</li>
            <li>A responsabilidade pelo conteúdo adicionado (itens, mensagens e fotos) é integralmente dos participantes da lista.</li>
            <li>O Criador da Lista (Dono) é o único com poder de remover membros ou excluir a lista permanentemente.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <Brain className="w-4 h-4 text-rose-500" />
            <span>3. Recursos de Inteligência Artificial</span>
          </div>
          <p>Recursos baseados em IA (OCR, Vision, Receitas) são fornecidos &quot;como estão&quot;:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>As IAs podem cometer erros (alucinações) ao identificar produtos ou sugerir receitas. <strong>Sempre valide as informações antes de realizar compras ou preparos culinários.</strong></li>
            <li>O uso destes recursos pode estar sujeito a limites de frequência para garantir a estabilidade do serviço.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <ShieldAlert className="w-4 h-4 text-amber-500" />
            <span>4. Modificações e Encerramento</span>
          </div>
          <p>Reservamo-nos o direito de atualizar estes termos para refletir novas funcionalidades ou mudanças regulatórias. O uso continuado do app após tais mudanças constitui aceitação dos novos termos.</p>
        </section>

        <section className="pt-12 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 text-center">
          Última atualização: 21 de Março de 2026 • Staff Level Governance
        </section>
      </div>
    </main>
  )
}
