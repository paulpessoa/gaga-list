# 🚀 Fase 4: Ecossistema de Receitas & Catálogo

Este documento guia a transformação do app em um assistente culinário e catálogo pessoal de produtos.

---

## 🎨 1. Refatoração & Performance (Sprint de Arrumação)
- [ ] **Extração de Componentes:** Mover o `ListCard` e modais de IA do Dashboard para arquivos separados em `components/dashboard/`.
- [x] **Type Safety:** Tipos do Supabase atualizados manualmente para incluir `my_products` e `recipes`.
- [ ] **Flattening de Rotas:** Mover conteúdo de `/dashboard/*` para a raiz `/` para URLs mais curtas. (KISS)
- [ ] **Limpeza de UI:** Remover componentes não utilizados (ex: QR Scanner genérico).

## 🥘 2. Receitas Inteligentes (Gemini 1.5 Flash)
- [x] **Infra de Receitas:** Tabela `recipes` criada no banco.
- [x] **Nova Tela de Receitas:** Listar receitas sugeridas pela IA com base em itens frequentes do usuário.
- [x] **Gerador de Lista via Receita:** Botão "Transformar em Lista" que cria uma nova lista com todos os ingredientes necessários.
- [x] **Salvar Receitas:** Persistência de sugestões da IA no perfil do usuário.
- [ ] ~~Busca de Receitas por Voz:~~ Removido para simplificação (KISS). O usuário pode usar o ditado do teclado.

## 🛍️ 3. Catálogo "Meus Produtos"
- [x] **Tela de Meus Produtos:** Visualizar todos os itens escaneados via AI Vision (em `/dashboard/products`).
- [x] **Busca & Filtros:** Organizar produtos por nome e marca.
- [x] **Navegação:** `TabBar` atualizada com link direto para o catálogo.

## 🤖 4. IA Avançada (Gemini / GROQ)
- [x] **OCR de Lista:** Criar lista a partir de foto de papel (Whisper Vision).
- [ ] ~~Limites de IA:~~ Adiado. Focar em UX antes de custos de escala.

---
*Assinado: Staff Engineer & Product Owner.*
