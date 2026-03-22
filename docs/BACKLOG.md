# 📋 BACKLOG PRIORIZADO (Spotify/Google Standard)
*Prioridade: P0 (Crítico) > P1 (Refinamento) > P2 (Delight)*

## 🎨 P0: UX & UI Refactor (Apple Standard)
- [ ] **Clean ListCards:** Refatorar o `ListCard` no dashboard. Remover avatares desnecessários, unificar barra de progresso e botão acessar (Clean UI).
- [ ] **Navigation Hierarchy:** Garantir que Telas Raiz não tenham botão voltar e Subtelas tenham botão voltar consistente.
- [ ] **Sticky Headers:** Implementar headers fixos em listas longas.

## 🤖 P1: Inteligência Artificial & Novos Fluxos
- [ ] **Nova Central de Itens (V2):** Repensar como o usuário gerencia produtos sem a bagunça da V1. 
  - *Nota Técnica:* O motor de receitas já suporta recebimento via Deep Link (`/app/recipes?items=nome1,nome2`).
- [ ] **Clonagem Staff:** Ferramenta no Admin para o "Staff" (você) clonar itens validados para o autocomplete global.

## 💰 P2: Monetização & Gamificação
- [ ] **Member Get Member:** Ganhar grãos ao convidar amigos (Virality loop).
- [ ] **Daily Check-in:** Recompensar o usuário por consistência (Retention loop).
- [ ] **Push Nudges:** Melhorar as animações de "aviso" quando um colaborador manda um sinal.

## 🛡️ P3: Qualidade & Telemetria
- [ ] **Testes E2E:** Implementar Playwright para os fluxos de Login e Criação de Lista.
- [ ] **Sentry Integration:** Monitorar erros em produção.
