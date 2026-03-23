# 📓 DIÁRIO DE DESENVOLVIMENTO (Project Journal)
*Histórico de marcos e decisões técnicas importantes.*

## 🗓️ 22 de Março de 2026
- **Strict AI Chef Protocol:** Implementada filtragem semântica rigorosa na IA de receitas. O sistema agora ignora itens não-comestíveis e foca 100% no inventário fornecido, elevando o realismo gastronômico.
- **Recipe 3-Tab System:** Refatorada interface de receitas para três categorias: "Minha Lista" (eficiência), "Inspiração" (descoberta com criação de lista automática) e "Meu Livro" (favoritos).
- **Help Center V1:** Criada central de suporte `/app/help` com FAQ reativo e busca fuzzy.
- **Charts Infrastructure:** Integrada a biblioteca **Recharts** para visualização de dados.
- **Recipe Flow Fix:** Refatorada criação de lista a partir de receita para fluxo sequencial.
- **Inventory Pivot:** Exclusão completa da página '/app/app/products'.
- **Navigation Align:** Tab Bar atualizada seguindo a UI_SPECS.

## 🗓️ 21 de Março de 2026
- **Integração Stripe:** Webhook concluído. O sistema agora recarrega grãos automaticamente após pagamento confirmado.
- **Admin Panel:** Flag `is_admin` funcional. Botão de acesso exclusivo no perfil para administradores.

## 🗓️ 20 de Março de 2026
- **Testes de IA:** Validação 100% de Vision (Red Bull Test), OCR (Lista Manuscrita), Voice (Gemini Extraction) e Recipes.
- **Atualização de Modelos:** Migração de todos os endpoints para `gemini-2.0-flash-exp` para máxima velocidade.
