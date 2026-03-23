# ❤️ HEARTBEAT (Recovery State)
*Este arquivo é a caixa-preta do projeto. Atualizado a cada turn significante.*

## 📍 Estado Atual
- **Data:** 22 de Março de 2026
- **Status:** Sistema de Créditos (Grãos) 100% funcional. Dashboard de Créditos com gráfico de consumo. List Detail com FAB ergonômico. Build estável.
- **Ambiente:** Next.js 15, Supabase, OpenAI/Gemini.

## 🛠️ Últimas Alterações (Checkpoint)
1. **Credits Dashboard Refactor:** Adicionado gráfico de consumo dos últimos 7 dias. Unificada a cor de "Voz" para Rose (Rosa) e ícones consistentes.
2. **Monetização Otimizada:** Card de recarga movido para logo abaixo do saldo principal na página de créditos.
3. **Functional AI Credits:** Removido 'AICreditLock' visual. Agora o bloqueio é via hook 'useAICreditCheck' que dispara o 'AICreditModal' global.
4. **Item Creation Hub:** Implementado FAB (Floating Action Button) e 'CreateItemModal' para limpeza visual da lista.

## 🚀 Próximos Passos Imediatos
1. Refatoração de UX (Apple Standard) na página de Perfil (limpeza de layout).
2. Implementação da Máscara de Preços nos itens da lista.
3. Clonagem Staff (Admin tool).

## 💾 Contexto de Recuperação
Se a sessão cair, leia: `docs/HEARTBEAT.md`, `docs/product/VISION.md` e `app/app/credits/page.tsx`.
