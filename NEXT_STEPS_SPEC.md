# 🚀 Fase 4: Ecossistema de Receitas & Catálogo

Este documento guia a transformação do app em um assistente culinário e catálogo pessoal de produtos.

---

## 🎨 1. Refatoração & Performance (Sprint de Arrumação)
- [ ] **Extração de Componentes:** Mover o `ListCard` e modais de IA do Dashboard para arquivos separados em `components/dashboard/`.
- [ ] **Type Safety:** Rodar o gerador de tipos do Supabase (ou atualizar manual) para garantir consistência total nos novos campos.
- [ ] **Sentry Integration:** Configurar monitoramento de erros para as rotas de IA.

## 🥘 2. Receitas Inteligentes (GROQ AI)
- [ ] **Nova Tela de Receitas:** Listar receitas sugeridas pela IA com base em itens frequentes do usuário.
- [ ] **Gerador de Lista via Receita:** Botão "Transformar em Lista" que cria uma nova lista com todos os ingredientes necessários.
- [ ] **Busca de Receitas por Voz:** "Sugira uma receita com frango e batata" -> IA gera e oferece criar a lista.

## 🛍️ 3. Catálogo "Meus Produtos"
- [ ] **Tela de Meus Produtos:** Visualizar todos os itens escaneados via AI Vision.
- [ ] **Busca & Filtros:** Organizar produtos por categoria e marca.
- [ ] **Histórico de Preços:** (Opcional) Guardar o último preço informado/lido para comparação.

## 💰 4. Estrutura Pro (Pre-Monetização)
- [ ] **Limites de IA:** Implementar contador de uso no banco para limitar o número de scans/áudios gratuitos por dia.

---
*Assinado: Staff Engineer & Product Owner.*
