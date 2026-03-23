"use client"

import { useState, useMemo } from "react"
import {
  ArrowLeft,
  Search,
  ChevronRight,
  Zap,
  ShoppingBag,
  Users,
  ShieldCheck,
  MessageCircle,
  X,
  HelpCircle,
  Plus
} from "lucide-react"
import Link from "next/link"
import { useHaptic } from "@/hooks/use-haptic"
import { motion, AnimatePresence } from "framer-motion"

const FAQ_DATA = [
  {
    category: "Grãos IA",
    icon: Zap,
    color: "text-amber-500 bg-amber-500/10",
    questions: [
      {
        q: "O que são Grãos Mágicos?",
        a: "Grãos são a energia que alimenta nossa IA. Cada ação como gerar receitas, escanear fotos ou comandos de voz consome uma quantidade específica de grãos."
      },
      {
        q: "Como ganho mais grãos?",
        a: "Você ganha grãos ao se cadastrar (bônus inicial), convidando amigos que criarem sua primeira lista, ou comprando pacotes na aba 'Energia IA'."
      }
    ]
  },
  {
    category: "Listas e Colaboração",
    icon: Users,
    color: "text-indigo-500 bg-indigo-500/10",
    questions: [
      {
        q: "Como convidar alguém para minha lista?",
        a: "Dentro de uma lista, clique no ícone de convite (pessoas) no topo. Você pode adicionar pelo e-mail ou compartilhar um link direto."
      },
      {
        q: "O que é o modo 'Cadê Tu?'",
        a: "É o nosso radar GPS. Se você e seus colaboradores ativarem a localização, poderão ver a distância entre vocês dentro do mercado em tempo real."
      }
    ]
  },
  {
    category: "Scanner e Voz",
    icon: Camera,
    color: "text-emerald-500 bg-emerald-500/10",
    questions: [
      {
        q: "O scanner não entendeu minha lista, e agora?",
        a: "Se o processamento falhar, oferecemos um botão 'Usar como Item Solto'. Ele salvará o texto bruto que a IA conseguiu ler para que você não perca nada."
      },
      {
        q: "Como adicionar itens por voz?",
        a: "No botão '+' da lista, toque no ícone de Microfone e diga o que precisa comprar. Ex: 'Dois quilos de carne e um pacote de arroz'."
      }
    ]
  }
]

export default function HelpPage() {
  const { trigger } = useHaptic()
  const [search, setSearch] = useState("")
  const [expandedIndex, setExpandedIndex] = useState<string | null>(null)

  const filteredFaq = useMemo(() => {
    if (!search) return FAQ_DATA
    const term = search.toLowerCase()
    return FAQ_DATA.map(cat => ({
      ...cat,
      questions: cat.questions.filter(
        q => q.q.toLowerCase().includes(term) || q.a.toLowerCase().includes(term)
      )
    })).filter(cat => cat.questions.length > 0)
  }, [search])

  const toggleQuestion = (id: string) => {
    trigger("light")
    setExpandedIndex(expandedIndex === id ? null : id)
  }

  return (
    <main className="min-h-screen p-6 md:p-12 max-w-2xl mx-auto flex flex-col gap-8 pb-32 bg-white dark:bg-zinc-950 transition-colors duration-300">
      <header className="flex items-center gap-4">
        <Link
          href="/app/profile"
          onClick={() => trigger("light")}
          className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-900 transition-all text-zinc-500 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-white/5 shadow-sm active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white leading-tight">
            Central de Ajuda
          </h1>
          <p className="text-sm text-zinc-500 font-medium">
            Dúvidas frequentes e suporte
          </p>
        </div>
      </header>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
        <input
          type="text"
          placeholder="Como eu ganho grãos?..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-zinc-100 dark:bg-zinc-900 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 text-zinc-900 dark:text-white placeholder:text-zinc-500 focus:outline-none transition-all shadow-inner font-bold text-sm"
        />
        {search && (
          <button 
            onClick={() => setSearch("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-zinc-900 dark:hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-8">
        {filteredFaq.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 dark:bg-zinc-900/20 rounded-[3rem] border-2 border-dashed border-zinc-200 dark:border-white/5">
            <HelpCircle className="w-10 h-10 text-zinc-200 dark:text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-500 text-sm font-medium">Nenhum resultado encontrado para sua busca.</p>
          </div>
        ) : (
          filteredFaq.map((cat, catIdx) => (
            <section key={catIdx} className="space-y-4">
              <div className="flex items-center gap-2 ml-1">
                <cat.icon className="w-3.5 h-3.5 text-zinc-400" />
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
                  {cat.category}
                </h2>
              </div>
              <div className="flex flex-col gap-3">
                {cat.questions.map((q, qIdx) => {
                  const id = `${catIdx}-${qIdx}`
                  const isOpen = expandedIndex === id
                  return (
                    <div 
                      key={qIdx}
                      className={`glass-panel rounded-[2rem] border transition-all duration-300 ${isOpen ? 'bg-indigo-50/30 dark:bg-indigo-500/5 border-indigo-500/20 shadow-lg' : 'bg-white dark:bg-zinc-900/40 border-zinc-100 dark:border-white/5'}`}
                    >
                      <button
                        onClick={() => toggleQuestion(id)}
                        className="w-full p-6 flex items-center justify-between text-left"
                      >
                        <span className={`text-sm font-black tracking-tight uppercase ${isOpen ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-700 dark:text-zinc-300'}`}>
                          {q.q}
                        </span>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${isOpen ? 'bg-indigo-500 text-white rotate-180' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                          <Plus className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-45' : ''}`} />
                        </div>
                      </button>
                      <AnimatePresence>
                        {isOpen && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-6 pb-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              {q.a}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Footer Suporte */}
      <section className="mt-8 p-8 rounded-[3rem] bg-zinc-900 dark:bg-white flex flex-col items-center text-center gap-6 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:rotate-12 transition-transform duration-500">
          <MessageCircle className="w-20 h-20 text-white dark:text-zinc-900" />
        </div>
        <div className="relative z-10">
          <h3 className="text-lg font-black text-white dark:text-zinc-900 mb-1">Ainda com dúvidas?</h3>
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Fale diretamente com o time do Lista Pronta.</p>
        </div>
        <a
          href="https://wa.me/5585991122334" // Substituir pelo seu número real
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trigger("medium")}
          className="relative z-10 w-full py-5 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl shadow-indigo-500/20"
        >
          <MessageCircle className="w-4 h-4" /> Chamar no WhatsApp
        </a>
      </section>
    </main>
  )
}
