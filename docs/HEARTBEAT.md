# ❤️ HEARTBEAT (Recovery State)
*Este arquivo é a caixa-preta do projeto. Atualizado a cada turn significante.*

## 📍 Estado Atual
- **Data:** 22 de Março de 2026
- **Status:** Sistema de Créditos funcional. Receitas com 3 abas ("Minha Lista", "Inspiração", "Meu Livro"). Chef IA Minimalista (Strict Ingredients) ativo. Central de Ajuda operacional.
- **Ambiente:** Next.js 15, Supabase, OpenAI/Gemini, Recharts.

## 🛠️ Últimas Alterações (Checkpoint)
1. **Strict AI Chef:** Refinado o prompt da IA para usar EXCLUSIVAMENTE os ingredientes fornecidos, evitando alucinações com itens extras ou eletrônicos.
2. **Recipe Tabs Refactor:** Página de receitas dividida em 3 abas claras para melhorar o fluxo de descoberta e eficiência.
3. **Empty List Filter:** Dropdown de receitas agora oculta listas vazias para evitar erros de geração.
4. **Help Center:** Implementada página `/app/help` com FAQ reativo e suporte via WhatsApp.
5. **UI Consistency:** 'CreateItemModal' alinhado visualmente com o 'CreateListModal'.

## 🚀 Próximos Passos Imediatos
1. Refatoração de UX (Apple Standard) na página de Perfil.
2. Implementação da Máscara de Preços nos itens da lista.
3. Área Administrativa: Dashboards globais usando a mesma infraestrutura de Recharts.

## 💾 Contexto de Recuperação
Se a sessão cair, leia: `docs/HEARTBEAT.md`, `docs/product/VISION.md` e `app/app/recipes/page.tsx`.
