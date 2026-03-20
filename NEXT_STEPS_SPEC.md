# 🚀 Refinamento de UX/UI & Features Críticas (Fase 2)

Este documento guia a próxima fase de polimento do **Gaga-List**. Foco em consistência visual, animações de feedback e fluxo de configurações.

---

## 🎨 1. Consistência Visual & UI
- [x] **Landing Page:** Ajustar botão principal para estilo `rounded-[1.25rem]` e tipografia `font-black`.
- [x] **Landing Page:** Remover botão de notificações (manter apenas em Configurações).
- [x] **Tab Bar (Bottom Nav):** Refinar cores e transparências (Light/Dark Mode).
- [x] **Botões Primários:** Padronizar "Onde estamos?" e "Salvar" com Indigo vibrante.
- [x] **Lixeira:** Mover acesso do Dashboard para o menu de Configurações.
- [ ] **List View:** Reposicionar botões de "CHAT" e "ONDE ESTAMOS" no header, ao lado dos avatares.

## ⚡ 2. Interações & Feedback (Haptics 2.0)
- [x] **Estilo de Ícones:** Padronizar cores em avisos e listas de membros.
- [x] **Feedback de Clique:** 
    *   **Sino:** Animação de "chacoalhar" (shake) + vibração (haptic).
    *   **Demais ícones:** Pulso leve + mudança de cor.
- [ ] **Nova Lista:** Adicionar botão "Ler QRCODE" no modal de criação para entrada rápida.

## ⚙️ 3. Fluxos de Configurações & Conta
- [x] **Correção de Tema:** Preferência do usuário sobrepõe sistema após seleção manual.
- [x] **Auto-save:** Salvamento `onBlur` nos campos de perfil.
- [x] **Segurança:** Manter botão explícito para troca de senha.
- [x] **Deleção de Conta:** Botão de exclusão com aviso de 30 dias e fluxo de e-mail.
- [ ] **Permissões (Investigar):** Avaliar se qualquer colaborador pode convidar novos membros ou se restringimos ao dono.

---
*Assinado: Staff Engineer & Product Owner.*
