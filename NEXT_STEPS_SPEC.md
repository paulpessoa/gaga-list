# 🚀 Lista Pronta - Roadmap de Produto & Arquitetura (Staff Level)

Este documento guia a evolução do aplicativo de um MVP funcional para um produto SaaS escalável, documentado e rentável.

---

## 🎨 Fase 4: Refatoração & Reestruturação (Atual)
- [ ] **Refatoração do Dashboard:** Extrair `ListCard` e modais para `components/dashboard/` (Limpando o `page.tsx`).
- [ ] **Flattening de Rotas (KISS):** Mover rotas de `/dashboard/*` para a raiz `/` (ex: `/recipes`, `/products`).
- [ ] **Documentação Contínua (ADR):** Criar pasta `docs/adr/` (Architecture Decision Records) para registrar o "Porquê" das decisões. Servirá como roteiro para vídeos do YouTube.

---

## 💰 Fase 5: Monetização & Gamificação de IA
- [ ] **Sistema de Créditos ("Grãos"):** 
  - Banco de Dados: Criar tabela `user_credits` (Free Tier vs. Paid).
  - UI do Usuário: Exibir saldo de "Grãos" (ex: "Você tem 500 grãos"). Geração de IA custa N grãos.
- [ ] **Gateway de Pagamento:** 
  - Integrar Stripe ou Apacate Pay para compra de pacotes de "Grãos" ou Assinatura Premium.
- [ ] **Admin Dashboard (Backoffice):** 
  - Rota protegida (ex: `/admin`) apenas para o dono do sistema.
  - Métricas: Custo da API (Gemini/Groq) vs. Consumo de Créditos vs. Receita.
  - Controle de Usuários: Capacidade de dar bônus de créditos para usuários beta.

---

## 🛡️ Fase 6: Qualidade de Engenharia & Telemetria
- [ ] **Testes Automatizados:**
  - *Unitários:* Testar utilitários e funções isoladas (Vitest).
  - *Integração:* Testar RLS do Supabase.
  - *E2E (Ponta-a-Ponta):* Testar fluxo crítico com Playwright (Login -> Criar Lista -> Adicionar Item).
- [ ] **Acessibilidade (A11y):**
  - Revisar contrastes, navegação por teclado e `aria-labels` seguindo as diretrizes WCAG 2.1.
- [ ] **Observabilidade & Telemetria:**
  - Integrar *Sentry* para captura de exceções no frontend e backend.
  - Integrar *PostHog* ou aprofundar *Clarity* para mapas de calor e funil de conversão.
  - Log estruturado nas Edge Functions.

---
*Assinado: Staff Engineer & Product Owner.*
