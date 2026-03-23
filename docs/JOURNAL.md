# 📓 DIÁRIO DE DESENVOLVIMENTO (Project Journal)
*Histórico de marcos e decisões técnicas importantes.*

## 🗓️ 22 de Março de 2026
- **Charts Infrastructure:** Integrada a biblioteca **Recharts** para visualização de dados. O dashboard de créditos agora utiliza um motor profissional que resolve bugs de fuso horário e escala.
- **Scrollable History:** Implementado scroll vertical no histórico de créditos para estabilidade de layout.
- **Recipe Flow Fix:** Refatorada criação de lista a partir de receita para fluxo sequencial, garantindo 100% de persistência.
- **CreateItemModal Alignment:** UI unificada com modal de listas.
- **Functional AI Credits:** Transição para bloqueio funcional via Modal Global.
- **Item Creation Hub:** Implementado FAB e Bottom Sheet.
- **Inventory Pivot:** Exclusão completa da página '/app/app/products'.
- **Navigation Align:** Tab Bar atualizada seguindo a UI_SPECS.
- **Resiliência de IA:** Fallback de texto bruto e prompts estruturados.

## 🗓️ 21 de Março de 2026
- **Integração Stripe:** Webhook concluído. O sistema agora recarrega grãos automaticamente após pagamento confirmado.
- **Admin Panel:** Flag `is_admin` funcional. Botão de acesso exclusivo no perfil para administradores.

## 🗓️ 20 de Março de 2026
- **Testes de IA:** Validação 100% de Vision (Red Bull Test), OCR (Lista Manuscrita), Voice (Gemini Extraction) e Recipes.
- **Atualização de Modelos:** Migração de todos os endpoints para `gemini-2.0-flash-exp` para máxima velocidade.
