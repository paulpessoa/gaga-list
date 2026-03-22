# ❤️ HEARTBEAT (Recovery State)

_Este arquivo é a caixa-preta do projeto. Atualizado a cada turn significante._

## 📍 Estado Atual

- **Data:** 22 de Março de 2026
- **Status:** Sistema de Créditos (Grãos) funcional via Modal Global. List Detail com FAB ergonômico e Item Creation Hub funcional. Build passando.
- **Ambiente:** Next.js 15, Supabase, OpenAI/Gemini.

## 🛠️ Últimas Alterações (Checkpoint)

1. **Functional AI Credits:** Removido o componente 'AICreditLock' (cadeados visuais). Agora o bloqueio é puramente funcional via hook 'useAICreditCheck' que dispara um **AICreditModal Global** elegante ao clicar.
2. **List Detail FAB:** Implementado Floating Action Button (FAB) no lado esquerdo inferior para adicionar itens, eliminando a poluição visual do topo da lista.
3. **Item Creation Hub:** Criado 'CreateItemModal' (Bottom Sheet) que centraliza voz, foto e input manual em um único local.
4. **Inventory Pivot:** Excluída a página '/app/app/products' e limpeza de abas redundantes em receitas.

## 🚀 Próximos Passos Imediatos

1. Refatoração de UX (Apple Standard) na página de Perfil (limpeza de layout).
2. Implementação da Máscara de Preços nos itens da lista.
3. Clonagem Staff (Admin tool).

## 💾 Contexto de Recuperação

Se a sessão cair, leia: `docs/HEARTBEAT.md`, `docs/product/VISION.md` e `hooks/use-user.ts`.
