# 🚀 Fase 4: Ecossistema de Receitas & Catálogo

Este documento guia a transformação do app em um assistente culinário e catálogo pessoal de produtos.

---

## 🎨 1. Refatoração & Performance (Sprint de Arrumação)
- [ ] **Extração de Componentes:** Mover o `ListCard` e modais de IA do Dashboard para arquivos separados em `components/dashboard/`.
- [x] **Type Safety:** Tipos do Supabase atualizados manualmente para incluir `my_products` e `recipes`.
- [ ] **Sentry Integration:** Configurar monitoramento de erros para as rotas de IA.

## 🥘 2. Receitas Inteligentes (GROQ AI)
- [x] **Infra de Receitas:** Tabela `recipes` criada no banco.
- [ ] **Nova Tela de Receitas:** Listar receitas sugeridas pela IA com base em itens frequentes do usuário.
- [ ] **Gerador de Lista via Receita:** Botão "Transformar em Lista" que cria uma nova lista com todos os ingredientes necessários.
- [ ] **Busca de Receitas por Voz:** "Sugira uma receita com frango e batata" -> IA gera e oferece criar a lista.

## 🛍️ 3. Catálogo "Meus Produtos"
- [x] **Tela de Meus Produtos:** Visualizar todos os itens escaneados via AI Vision (em `/dashboard/products`).
- [x] **Busca & Filtros:** Organizar produtos por nome e marca.
- [x] **Navegação:** `TabBar` atualizada com link direto para o catálogo.

## 🤖 4. IA Avançada (GROQ)
- [x] **OCR de Lista:** Criar lista a partir de foto de papel (Whisper Vision).
- [ ] **Limites de IA:** Implementar contador de uso no banco para controle de custos.

---
*Assinado: Staff Engineer & Product Owner.*
