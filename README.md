# 🧺 Gaga List | AI-Powered Smart Grocery Shopping

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.0-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Vercel-Deploy-000000?style=flat-square&logo=vercel)](https://vercel.com/)

**Gaga List** é um Progressive Web App (PWA) de alto padrão, desenvolvido com foco em performance extrema e experiência mobile-first. Ele transforma listas de compras em ferramentas inteligentes usando IA (Gemini, OpenAI, Groq) e sincronização em tempo real.

---

## 📺 Demo Video
> [!IMPORTANT]
> Assista ao vídeo de demonstração capturado diretamente do smartphone para ver a fluidez e os feedbacks hápticos em ação:
> **[LINK PARA O SEU VÍDEO AQUI]**

---

## 💎 Diferenciais Técnicos (Recruiter's Quick Look)

Para recrutadores e engenheiros sêniores, aqui estão os pontos de destaque na arquitetura deste projeto:

- **Arquitetura Limpa (Clean Architecture):** Separação clara entre camadas de interface (`components`), lógica de negócio (`services`) e gerenciamento de estado (`hooks`).
- **Next.js 15 + React 19:** Uso de **React Server Components (RSC)** por padrão para minimizar o bundle size no cliente.
- **Tailwind CSS 4.0:** Implementação de um Design System customizado ("Electric Sophistication") usando a nova engine v4.
- **Observabilidade:** Integrado com **Microsoft Clarity** para análise de UX e preparado para **Sentry**.
- **IA Multi-Model:**
  - **Voz:** Whisper (via Groq) para latência < 500ms.
  - **Visão:** GPT-4o-mini para extração de itens de fotos.
  - **Lógica:** Gemini 1.5 Flash para geração de receitas e categorização inteligente.
- **PWA Avançado:** Suporte offline com service workers, sincronização em tempo real via Supabase Realtime e feedback háptico (vibration API).

---

## 🎨 Design System: "Electric Sophistication"

O projeto utiliza uma paleta proprietária focada em ambientes de baixa luminosidade (supermercados):
- **Primary:** Neon Green (`#53E076`)
- **Base:** Obsidian Black (`#131313`)
- **Efeito:** Glassmorphism com haptic feedback em cada interação.

---

## 🛠️ Tech Stack & Ferramentas

| Categoria | Tecnologia |
| :--- | :--- |
| **Frontend** | Next.js 15 (App Router), TypeScript, Tailwind 4, Framer Motion |
| **Backend** | Supabase (Auth, Postgres, Realtime, Edge Functions) |
| **IA** | Google Gemini, OpenAI GPT-4o, Groq (Whisper) |
| **Payments** | Stripe Integration |
| **PWA** | Workbox, Web Manifest, Push Notifications |
| **Testes** | Playwright (E2E) |

---

## 🚀 Como Executar

1. **Clone & Install:**
   ```bash
   git clone https://github.com/paulpessoa/gaga-list.git
   npm install
   ```

2. **Env Config:**
   Renomeie `.env.example` para `.env.local` e preencha as chaves do Supabase e APIs de IA.

3. **Dev Mode:**
   ```bash
   npm run dev
   ```

---

## 👔 Autor

**Paul Pessoa** - Staff Software Engineer
> Focado em construir produtos escaláveis que resolvem problemas reais com IA e UX de ponta.

---
*Este projeto segue os princípios SOLID e DRY, priorizando manutenibilidade e performance (Core Web Vitals).*
