# 🚀 Gaga-List: Specification & Execution Plan (Phase 2)

## 🎯 Visão do Produto
Transformar o Gaga-List em um PWA colaborativo de alto impacto, utilizando recursos de hardware (vibração/GPS) e tempo real (Supabase Realtime) para criar uma experiência fluida durante as compras.

---

## 🏗️ Alterações Arquiteturais & UX

### 1. Navegação e Layout Principal
- **Dashboard Header:** Remover o Avatar e o Email. Manter apenas o título "Minhas Listas" para um visual mais limpo (Clean UI).
- **TabBar (Rodapé):** O ícone "Config" (Settings) deve ser ativado e rotear para `/dashboard/settings`.

### 2. Nova Página: Configurações (`/dashboard/settings`)
Esta página será a central de controle do usuário.
- **Ações:** Botão de Logout movido para cá.
- **Toggles de Permissão (Salvos na tabela `profiles`):**
  - [ ] Compartilhar Geolocalização (Aceitar enviar/receber GPS no "Cadê tu?").
  - [ ] Tema (Dark/Light).
  - [ ] Notificações / Vibração (Permitir que enviem um "Sino" para você).
  - [ ] Permitir Ligações (Exibir seu número de telefone para colaboradores).

### 3. Ações de Colaborador (List Detail / Share Modal)
Em cada card de colaborador dentro de uma lista, teremos uma "Action Bar" com 4 botões:
1.  🔔 **Sino (Nudge):** Dispara um evento Realtime. Se o alvo estiver com o app aberto e com permissão, o celular dele vibra (Haptics API).
2.  📞 **Ligar:** Um link `tel:+55...` (Disponível apenas se o usuário permitiu e preencheu o telefone nas configs).
3.  💬 **Chat:** Abre um modal/drawer de chat em tempo real específico para aquela lista (Supabase Realtime).
4.  📍 **Mapa (Cadê tu):** Atalho rápido para ver aquele usuário específico no mapa.

### 4. Recurso "Cadê Tu?" (Mapa)
- **Status:** Já iniciado, mas precisa de polimento.
- **Requisitos:** 
  - Mostrar a distância em metros/km entre o usuário logado e os colaboradores.
  - Atualização fluida via Supabase Realtime.
  - Respeitar estritamente o toggle de "Compartilhar Geolocalização" das Configurações. Se o user desligar, ele some do mapa para os outros.

---

## 🛠️ Plano de Execução (Roadmap Técnico)

**Fase A: Limpeza e Configurações (Foundation)**
- [ ] Atualizar tabela `profiles` no Supabase: adicionar colunas `phone`, `allow_calls`, `allow_notifications`.
- [ ] Limpar o Header do `app/dashboard/page.tsx`.
- [ ] Criar a página `app/dashboard/settings/page.tsx` com os Toggles e o Logout.
- [ ] Atualizar o componente `TabBar` para linkar para `/dashboard/settings`.

**Fase B: Interações na Lista (Action Bar)**
- [ ] Modificar o `ShareModal` e a listagem de colaboradores para incluir os ícones (Sino, Telefone, Chat, Mapa).
- [ ] Integrar a Haptic Feedback API do navegador para a função do Sino (Disparada via canal de broadcast do Supabase Realtime).

**Fase C: Comunicação (Chat & Mapa)**
- [ ] Criar tabela `list_messages` (se o chat for persistente) ou configurar um `Channel` Realtime puro.
- [ ] Criar o componente de Chat em tempo real (Drawer/Modal).
- [ ] Polimento no cálculo de distância e renderização do mapa no `cade-tu`.

---
*Este documento é a fonte da verdade para o desenvolvimento atual. Pode ser consumido pelo Engenheiro (IA) a qualquer momento para retomar o contexto.*
