# 🚀 Especificação de Refatoração e Novas Features (Staff Next Steps)

Este documento descreve a próxima fase de evolução do **Gaga-List (Lista Pronta)**. Focaremos em simplificação de código, reformulação do Light Mode e adição de features robustas para supermercado.

---

## 🎨 1. UX/UI & Simplificação Visual

### 1.1. O Problema do Light Mode
*   **Diagnóstico:** O uso excessivo de transparências (`bg-white/10`), bordas brancas e sombras pesadas não traduz bem para o tema claro, resultando em baixo contraste e aspecto "sujo".
*   **Solução (Design System):** 
    *   No *Light Mode*, usaremos fundos sólidos (`bg-white`, `bg-zinc-50`), bordas sutis (`border-zinc-200`) e sombras suaves (`shadow-sm`, `shadow-md`).
    *   Remover fundos `glassmorphism` pesados no tema claro.
    *   Manter o *Dark Mode* intacto, ajustando apenas variáveis CSS com Tailwind (`dark:bg-zinc-900`, etc).

### 1.2. Refatoração dos Cards de Lista (`/dashboard`)
*   **Informações Enriquecidas:** Exibir o total de itens e itens concluídos (ex: "5/12 itens comprados").
*   **Ações Acessíveis:**
    *   **Botão de Edição:** Adicionar um ícone de lápis (`Edit2`) direto no card para renomear a lista facilmente.
    *   **Botão de Deleção Mais Visível:** Botão de lixeira (`Trash2`) com cor vermelha (`text-red-500`).
*   **Controle de Permissão (Deleção):**
    *   Se o usuário atual não for o `owner` da lista, o botão de apagar será **oculto** (melhor UX que mostrar erro) ou desabilitado com tooltip.

### 1.3. Simplificação Interna da Lista (`/dashboard/lists/[id]`)
*   **Avatares:** Avaliar a remoção de avatares individuais por item para focar no conteúdo.
*   **Header:** Trazer a edição do nome da lista para o próprio cabeçalho ao clicar no título.

---

## 🗑️ 2. Arquitetura de "Soft Delete" (Lixeira)

*   **Visão Geral:** Listas apagadas irão para uma lixeira e serão excluídas permanentemente após 30 dias. Podem ser restauradas.
*   **Impacto no Banco de Dados (Supabase):**
    *   Adicionar coluna `deleted_at (TIMESTAMP)` na tabela `lists`. Se for `NULL`, a lista está ativa.
    *   Criar uma View ou Action no Frontend para listar `/dashboard/trash`.
    *   **Edge Function/Cron Job (pg_cron):** Criar rotina no Supabase para rodar diariamente e fazer `DELETE FROM lists WHERE deleted_at < NOW() - INTERVAL '30 days'`.

---

## 🛒 3. Supercharged Items (A Experiência de Supermercado)

### 3.1. Autocomplete e Categorias
*   **Catálogo Padrão:** Criar um dicionário/JSON local (ou no DB) com itens comuns de supermercado divididos por categorias (Açougue, Limpeza, Hortifruti, Padaria).
*   **Input Inteligente:** Ao digitar no campo de adicionar item, um dropdown exibe sugestões. Clicar adiciona instantaneamente.

### 3.2. Metadados do Item (Rich Items)
*   **Edição Inline:** Ao tocar no nome do item, ele vira um input para edição rápida.
*   **Novas Propriedades:**
    *   `quantity`: (ex: 2, 500g)
    *   `price`: (ex: R$ 5,99) -> Permitirá somar o valor total da lista no futuro.
    *   `notes`: Observação (ex: "Marca X ou Y").
*   **Impacto no Banco de Dados:** Atualizar tabela `list_items` adicionando colunas `quantity (TEXT)`, `price (DECIMAL)`, `notes (TEXT)`.

### 3.3. Atribuição de Check (Quem marcou?)
*   **Visão Geral:** Quando uma lista é colaborativa, é essencial saber quem pegou o item.
*   **Impacto no Banco de Dados:** 
    *   Adicionar coluna `checked_by (UUID)` referenciando `profiles.id` na tabela `list_items`.
    *   Adicionar coluna `checked_at (TIMESTAMP)`.
*   **UI:** Quando o item estiver riscado, mostrar um pequeno avatar ou nome em texto diminuto: *"Comprado por João"*.

---

## 🛠️ 4. Plano de Execução (Roadmap para Amanhã)

1.  **Fase 1: Banco de Dados (Supabase)**
    *   Rodar migrations para adicionar `deleted_at` em `lists`.
    *   Rodar migrations para adicionar `quantity`, `price`, `notes`, `checked_by`, `checked_at` em `list_items`.
    *   Atualizar o arquivo de tipos gerados (`database.types.ts`).

2.  **Fase 2: UI/UX Foundation (Temas e Cards)**
    *   Reescrever a paleta Light no `tailwind.config` / `globals.css` (Remover glassmorphism sujo).
    *   Refatorar os Cards do Dashboard com totais de itens e permissões corretas no botão de lixeira.
    *   Implementar a interface da "Lixeira".

3.  **Fase 3: Super Items & Autocomplete**
    *   Construir componente de `ItemInput` com Autocomplete.
    *   Refatorar o card de Item individual para acomodar Preço, Quantidade e Observações expandíveis.
    *   Adicionar a sinalização visual de *Quem deu o check*.

---
*Assinado: Staff Engineer & Product Specialist.*