# ❤️ HEARTBEAT (Recovery State)

_Este arquivo é a caixa-preta do projeto. Atualizado a cada turn significante._

## 📍 Estado Atual

- **Data:** 22 de Março de 2026
- **Status:** Sistema de Créditos (Grãos) funcional, Vision/OCR com fallback de texto bruto e prompts resilientes. Build passando.
- **Ambiente:** Next.js 15, Supabase, OpenAI/Gemini.

## 🛠️ Últimas Alterações (Checkpoint)

1. **Inventory Pivot:** Excluída a página '/app/app/products' devido a complexidade e bagunça.
2. **Navigation Cleanup:** Removidos links de 'Itens' e 'Avisos' da Tab Bar. Adicionada rota 'Pessoas'.
3. **Vision/OCR Resilience:** Botão "Usar como Texto Solto" adicionado para falhas de parse.

## 🚀 Próximos Passos Imediatos

1. Refatoração de UX (Apple Standard) nos cards de lista (ListCard).
2. Implementação de uma nova Central de Itens (opcional, sob demanda).
3. Melhorar a navegação de sub-telas (Botão Voltar consistente).

## 💾 Contexto de Recuperação

Se a sessão cair, leia: `docs/HEARTBEAT.md`, `docs/product/VISION.md` e `hooks/use-user.ts`.
