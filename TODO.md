# 📋 TODO: Backlog de Melhorias e Evolução (Gaga List)

## 🔴 PRIORIDADE CRÍTICA (FAZER AGORA)

- [ ] **Limpar Dados de Teste:** 
  - Remover "CALDEIRA DE CALOR" do DB.
  - Corrigir valores absurdos em Higiene (Cotonete R$ 434.342,54 -> Realista ~R$ 5-10).
- [x] **Correção de Typo em Avisos:** `/app/notifications` - "Clique para abrir a conversa ou fixeira" -> "fixá-la".

## 🟠 ALTA PRIORIDADE (PRÓXIMAS 2 SEMANAS)

- [ ] **Navegação Consistente:**
  - Adicionar indicador visual de página ativa na Tab Bar (`aria-current="page"`).
  - Remover redundância: Links RECEITAS/PRODUTOS aparecem no Header e na Bottom Bar. Manter apenas Bottom Bar.
- [ ] **UX & Feedback:**
  - Tooltips/Feedback para botões `disabled` (Ex: Criar Lista).
  - Feedback antes de consumir Grãos (Modal de confirmação).
  - Validação em tempo real no formulário de Nova Lista (Campo obrigatório *).
- [ ] **Clareza Grãos Mágicos:**
  - Modal explicativo: O que são? Quanto cada feature consome? Como ganhar mais?

## 🟡 MÉDIA PRIORIDADE (PRÓXIMAS 4 SEMANAS)

- [ ] **Reorganização de Receitas:**
  - Dividir em abas ou sub-páginas para reduzir scroll e loadtime.
- [ ] **Interface Interna da Lista:**
  - Header: Botão Voltar + Título + Ícone Edição.
  - Subtítulo: Contador + Somatório dinâmico.
  - Input: Ícones de Câmera e Áudio integrados.
  - Filtros: Faltando | Comprado | A-Z | Recentes.
- [ ] **Página de Avisos:**
  - Melhorar estado vazio (Ícone amigável + CTA para convidar amigos).

## 🟢 LONGO PRAZO & GAMIFICAÇÃO

- [ ] **Sistema Earn Grains:**
  - Programa de Indicação (MGM) - 50 grãos para quem convida e quem entra.
  - Daily Check-in (3 dias seguidos = 10 grãos).
  - Tarefas: Marcar 10 itens = +5 grãos.
- [ ] **Busca/Filtro Global:** Pesquisar listas na home.
- [ ] **Dark Mode Toggle:** Opção manual em Configurações.
- [ ] **Avatar Editável:** Upload de foto de perfil.

## ⚙️ INFRA & ADMIN

- [ ] **Admin Sync:** Funcionalidade para clonar itens validados para a base global (autocomplete).
- [ ] **Telemetria:** Integrar Sentry/PostHog para monitoramento de erros e UX.
- [ ] **Testes:** Implementar Vitest (Unitários) e Playwright (E2E - Fluxo Crítico).

---
*Assinado: Staff Engineer & Product Owner.*
