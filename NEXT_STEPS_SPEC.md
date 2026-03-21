# 🚀 Visão Futurista: Inteligência e Praticidade (Fase 3)

Este documento guia a evolução do **Gaga-List** para um assistente de compras inteligente usando **GROQ AI**.

---

## 🎨 1. Consistência e Limpeza (Concluído)
- [x] Remoção de tema manual (foco 100% no sistema/dispositivo).
- [x] Remoção de biometria (simplificação do core).
- [x] Auto-save no perfil (`onBlur`).
- [x] Botões de ação da lista no topo (Chat/Mapa).
- [x] Redesenho dos Cards do Dashboard (UX Premium).
- [x] Toggles de Hardware em Configurações.

## 🤖 2. Inteligência Artificial (GROQ AI)
- [ ] **AI Scanner (Menu Inferior):**
    *   Botão central de scanner no TabBar.
    *   Foto do produto -> GROQ Vision -> Identificação automática.
    *   Fluxo: Salvar em "Meus Produtos" ou Adicionar à Lista Aberta.
    *   Sugestões de IA: Benefícios do produto e usos em receitas.
- [ ] **Criação de Lista por Voz:**
    *   Botão de microfone no modal "Nova Lista".
    *   Transcrição -> GROQ -> Extração de itens organizada por categoria.
- [ ] **Criação por Foto de Papel:**
    *   Fotografar lista escrita à mão ou folheto -> GROQ Vision -> Nova lista digital.

## 📦 3. Novas Features de Valor
- [x] **Permissões 2.0:** Qualquer membro da lista pode convidar novos membros (RLS atualizado).
- [x] **Infra Meus Produtos:** Tabela `my_products` criada e pronta para o scanner.
- [ ] **Receitas Inteligentes:** Gerar listas completas a partir de uma receita (ex: "Ingredientes para Carbonara").
- [x] **QR Code Real:** Leitura de QR Code funcional no Dashboard para entrar em listas.

## 💰 4. Estrutura de Monetização
- [ ] Organizar endpoints de IA (`/api/ai/*`) para permitir controle de uso por usuário (Pay-per-use ou Assinatura).

---
*Assinado: Staff Engineer & Visionary Founder.*
