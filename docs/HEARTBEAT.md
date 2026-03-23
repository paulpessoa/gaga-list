# ❤️ HEARTBEAT (Recovery State)
*Este arquivo é a caixa-preta do projeto. Atualizado a cada turn significante.*

## 📍 Estado Atual
- **Data:** 22 de Março de 2026
- **Status:** Sistema de Créditos 100% funcional. Fluxo Receita -> Lista corrigido (sequencial). Dashboard de Créditos com gráfico resiliente e layout denso.
- **Ambiente:** Next.js 15, Supabase, OpenAI/Gemini.

## 🛠️ Últimas Alterações (Checkpoint)
1. **Recipe Creation Fix:** Corrigida a função `createListFromRecipe` para salvar itens de forma sequencial, resolvendo falhas de persistência.
2. **Credits Graph & Layout:** Gráfico de consumo corrigido para normalização ISO. Tabela de preços movida para o topo e compactada (lado a lado).
3. **Item Creation Hub:** 'CreateItemModal' alinhado visualmente com 'CreateListModal' (Design System unificado).
4. **Credits Dashboard Refactor:** Unificada a cor de "Voz" para Rose (Rosa) e ícones consistentes.

## 🚀 Próximos Passos Imediatos
1. Refatoração de UX (Apple Standard) na página de Perfil (limpeza de layout).
2. Implementação da Máscara de Preços nos itens da lista.
3. Clonagem Staff (Admin tool).

## 💾 Contexto de Recuperação
Se a sessão cair, leia: `docs/HEARTBEAT.md`, `docs/product/VISION.md` e `app/app/credits/page.tsx`.
