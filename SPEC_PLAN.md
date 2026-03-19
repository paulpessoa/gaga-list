# 🚀 Lista Pronta: Specification & Execution Plan (Phase 2)

## 🎯 Visão do Produto

Transformar o Lista Pronta em um PWA colaborativo de alto impacto, utilizando recursos de hardware (vibração/GPS) e tempo real (Supabase Realtime) para criar uma experiência fluida durante as compras.

---

## 🏗️ Alterações Arquiteturais & UX

### 1. Navegação e Layout Principal

- **Dashboard Header:** Remover o Avatar e o Email. Manter apenas o título "Minhas Listas" para um visual mais limpo (Clean UI). [CONCLUÍDO]
- **TabBar (Rodapé):** O ícone "Config" (Settings) deve ser ativado e rotear para `/dashboard/profile`. [CONCLUÍDO]

### 2. Nova Página: Configurações (`/dashboard/profile`)

Esta página será a central de controle do usuário.

- **Ações:** Botão de Logout movido para cá. [CONCLUÍDO]
- **Toggles de Permissão (Salvos na tabela `profiles`):**
  - [x] Compartilhar Geolocalização (Aceitar enviar/receber GPS no "Cadê tu?"). [CONCLUÍDO]
  - [ ] Tema (Dark/Light).
  - [x] Notificações / Vibração (Permitir que enviem um "Sino" para você). [CONCLUÍDO]
  - [x] WhatsApp / Telefone. [CONCLUÍDO]

### 3. Ações de Colaborador (List Detail / Share Modal)

Em cada card de colaborador dentro de uma lista, teremos uma "Action Bar" com 4 botões: [CONCLUÍDO]

1.  🔔 **Sino (Nudge):** Dispara um evento Realtime. Se o alvo estiver com o app aberto e com permissão, o celular dele vibra (Haptics API). [CONCLUÍDO]
2.  📞 **Ligar:** Um link `tel:+55...` (Disponível apenas se o usuário permitiu e preencheu o telefone nas configs). [CONCLUÍDO]
3.  💬 **Chat:** Abre um modal/drawer de chat em tempo real específico para aquela lista (Supabase Realtime). [PENDENTE]
4.  📍 **Mapa (Cadê tu):** Atalho rápido para ver aquele usuário específico no mapa. [CONCLUÍDO]

### 4. Recurso "Cadê Tu?" (Mapa)

- **Status:** Já iniciado, mas precisa de polimento.
- **Requisitos:**
  - Mostrar a distância em metros/km entre o usuário logado e os colaboradores. [CONCLUÍDO]
  - Atualização fluida via Supabase Realtime. [CONCLUÍDO]
  - Respeitar estritamente o toggle de "Compartilhar Geolocalização" das Configurações. Se o user desligar, ele some do mapa para os outros. [CONCLUÍDO]

---

## 🛠️ Plano de Execução (Roadmap Técnico)

**Fase A: Limpeza e Configurações (Foundation)**

- [x] Atualizar tabela `profiles` no Supabase: adicionar colunas `phone`, `allow_notifications`.
- [x] Limpar o Header do `app/dashboard/page.tsx`.
- [x] Criar a página `app/dashboard/profile/page.tsx` com os Toggles e o Logout.
- [x] Atualizar o componente `TabBar` para linkar para `/dashboard/profile`.

**Fase B: Interações na Lista (Action Bar)**

- [x] Modificar o `ShareModal` e a listagem de colaboradores para incluir os ícones (Sino, Telefone, Chat, Mapa).
- [x] Integrar a Haptic Feedback API do navegador para a função do Sino (Disparada via canal de broadcast do Supabase Realtime).

**Fase C: Comunicação (Chat & Mapa)**

- [x] Criar tabela `list_messages` (se o chat for persistente) ou configurar um `Channel` Realtime puro.
- [x] Criar o componente de Chat em tempo real (Drawer/Modal).
- [x] Polimento no cálculo de distância e renderização do mapa no `cade-tu`.

---

_Este documento é a fonte da verdade para o desenvolvimento atual. Pode ser consumido pelo Engenheiro (IA) a qualquer momento para retomar o contexto._
