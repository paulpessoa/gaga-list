"use client"

import { ArrowLeft, Shield, Brain, MapPin, MessageCircle } from "lucide-react"
import Link from "next/link"

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-300 p-8 md:p-24 max-w-4xl mx-auto pb-32">
      <header className="mb-12 flex items-center gap-4">
        <Link href="/" className="p-2 rounded-full hover:bg-zinc-900 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 font-black">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">Política de Privacidade</h1>
      </header>

      <div className="space-y-12 leading-relaxed">
        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <Shield className="w-4 h-4 text-indigo-500" />
            <span>1. Coleta de Dados</span>
          </div>
          <p>O <strong>Lista Pronta</strong> coleta as informações estritamente necessárias para a experiência colaborativa: seu nome, e-mail, foto de perfil e dados de listas. Estes dados são armazenados de forma segura na infraestrutura da Supabase.</p>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <Brain className="w-4 h-4 text-emerald-500" />
            <span>2. Processamento por Inteligência Artificial</span>
          </div>
          <p>Utilizamos tecnologias de ponta (Google AI Studio, OpenAI e Groq) para recursos como OCR de fotos, identificação de produtos via Vision, transcrição de voz e geração de receitas. Ao utilizar estes recursos:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Os dados (imagens, áudio ou nomes de produtos) são enviados para processamento temporário nestes provedores.</li>
            <li>Nenhum dado sensível é utilizado para treinamento de modelos globais por nossa parte.</li>
            <li>O processamento é feito exclusivamente para retornar a informação estruturada solicitada por você.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <MapPin className="w-4 h-4 text-rose-500" />
            <span>3. Uso da Localização (Radar GPS)</span>
          </div>
          <p>O recurso “Cadê tu?” utiliza sua geolocalização em tempo real via Supabase Realtime. Importante saber:</p>
          <ul className="list-disc pl-6 space-y-2 text-sm">
            <li>Sua localização só é compartilhada se você ativar o recurso explicitamente.</li>
            <li>O compartilhamento ocorre apenas com membros da mesma lista.</li>
            <li><strong>Não armazenamos histórico de localização.</strong> Os dados são efêmeros e desaparecem assim que você fecha o app ou desativa o recurso.</li>
          </ul>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-3 text-white font-black uppercase text-xs tracking-widest">
            <MessageCircle className="w-4 h-4 text-indigo-400" />
            <span>4. Comunicação e Chat</span>
          </div>
          <p>As mensagens trocadas no chat das listas são armazenadas para permitir a colaboração. Mensagens individuais enviadas através da Central de Avisos podem ser deletadas permanentemente ao limpar a lista de notificações.</p>
        </section>

        <section className="pt-12 border-t border-white/5 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600 text-center">
          Última atualização: 21 de Março de 2026 • Staff Level Security
        </section>
      </div>
    </main>
  )
}
