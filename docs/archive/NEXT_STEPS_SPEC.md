# 🚀 Lista Pronta - Roadmap de Produto & Arquitetura (Staff Level)

Este documento guia a evolução do aplicativo de um MVP funcional para um produto SaaS escalável, documentado e rentável.

---

## 🎨 Fase 4: Refatoração, UX & UI (Foco em Produto)

### 📱 Navegação Global & Tab Bar
- [ ] **Tab Bar Consistente:** 
  - Itens: Items (Meus Itens), Listas, Receitas, Pessoas, Perfil.
  - Legenda: Adicionar label "Listas" ao ícone central.
  - Visual: Destacar apenas o menu selecionado (Remover destaque fixo central).
- [ ] **Hierarquia de Navegação:**
  - Telas Raiz: Remover botão "voltar" do header (acesso apenas via Tab Bar).
  - Subtelas (ex: Interna de Lista): Manter botão "voltar" consistente para retornar à tela anterior.
  - Sticky Headers: Implementar `sticky top-0` em headers de listas longas.

### 📋 Dashboard de Listas
- [ ] **Otimização de Performance (Cards):** 
  - Remover exibição de avatares/membros nos cards da dashboard (reduzir complexidade de queries relacionais).
  - Exibir apenas: Nome da lista, subtítulo (proprietário/colaborador) e barra de progresso.
  - Botão "Acessar" posicionado à frente da barra de progresso.
- [ ] **UX de Criação:**
  - Ajustar modal de "Nova Lista": Ordem dos elementos -> Áudio, Foto, Input, Botão Criar.
  - Prevenir abertura automática do teclado se isso ocultar os botões de Áudio/Foto.

### 📝 Interface Interna da Lista
- [ ] **Header Funcional:**
  - Esquerda: Botão Voltar + Título + Ícone de Edição (ao lado do título).
  - Subtítulo: Contador de itens + Somatório dinâmico (Valor Comprado vs. Valor Restante).
  - Direita: Botões de Chat, Mapa e Sair/Deletar (Sair para convidados, Deletar para donos).
- [ ] **Input Híbrido:**
  - Campo de texto para busca/adição.
  - Integração de ícones de Câmera/Vision e Áudio diretamente no ou ao lado do input.
- [ ] **Filtros & Ordenação:**
  - Remover filtro "Tudo".
  - Opções: Faltando | Comprado | A-Z | Mais Recentes.
  - Botão "Limpar": Resetar para o estado inicial da lista.
- [ ] **Financeiro:**
  - Implementar máscara de preços robusta nos itens.
  - Sincronizar estado global para exibição da soma no header.

### 🗺️ Localização & Mapas
- [ ] **UX de Permissão:** Alterar mensagem de "Acesso Negado" para um aviso amigável solicitando a ativação do GPS/Localização local.

---

## 🤖 Fase 5: Inteligência Artificial (Vision & Voice)
- [ ] **Adição por Áudio:** Criar/Validar endpoint de serviço que processe o áudio (Whisper/Gemini) e extraia itens para a lista atual.
- [ ] **Adição por Imagem (Vision):** Implementar processamento de fotos de listas físicas ou produtos para inserção automática.
- [ ] **Itens & Autocomplete:**
  - Tela "Itens": Permitir seleção múltipla para gerar receitas ou enviar para listas específicas.
  - Admin Sync: Criar funcionalidade para o administrador "clonar" itens validados para a base global de autocomplete.

---

## 💰 Fase 6: Monetização & Gamificação
- [ ] **Sistema de Créditos ("Grãos"):** 
  - Banco de Dados: Criar tabela `user_credits` (Free Tier vs. Paid).
  - UI do Usuário: Exibir saldo de "Grãos". Geração de IA consome créditos.
- [ ] **Gateway de Pagamento:** Integrar Stripe para compra de pacotes de "Grãos" ou Assinatura Premium.
- [ ] **Admin Dashboard (Backoffice):** 
  - Rota `/admin` para gestão de custos de API vs. Receita.
  - Gestão de usuários e bônus de créditos.

---

## 🛡️ Fase 7: Qualidade de Engenharia & Telemetria
- [ ] **Testes Automatizados:** Vitest (Unitários), Playwright (E2E - Fluxo Crítico).
- [ ] **Observabilidade:** Sentry (Erros) + PostHog/Clarity (UX & Funis).
- [ ] **Acessibilidade:** Revisão WCAG 2.1 (Contrastes e Aria-labels).

---
*Assinado: Staff Engineer & Product Owner.*
