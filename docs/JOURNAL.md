# 📓 DIÁRIO DE DESENVOLVIMENTO (Project Journal)
*Histórico de marcos e decisões técnicas importantes.*

## 🗓️ 22 de Março de 2026
- **Credits UX Refactor:** Implementado gráfico de consumo semanal e unificação visual da feature de Voz (Rose/Mic).
- **Functional AI Credits:** Transição do bloqueio visual (cadeados) para bloqueio funcional via Modal Global.
- **Item Creation Hub:** Implementado FAB e Bottom Sheet para adição de itens, otimizando espaço em tela.
- **Inventory Pivot:** Exclusão completa da página '/app/app/products' e limpeza de abas redundantes em receitas. Foco total em simplificação de UX.
- **Navigation Align:** Tab Bar atualizada seguindo a UI_SPECS. Link de 'Avisos' removido do menu principal.
- **Resiliência de IA:** Fallback de texto bruto e prompts estruturados.

## 🗓️ 21 de Março de 2026
- **Integração Stripe:** Webhook concluído. O sistema agora recarrega grãos automaticamente após pagamento confirmado.
- **Admin Panel:** Flag `is_admin` funcional. Botão de acesso exclusivo no perfil para administradores.

## 🗓️ 20 de Março de 2026
- **Testes de IA:** Validação 100% de Vision (Red Bull Test), OCR (Lista Manuscrita), Voice (Gemini Extraction) e Recipes.
- **Atualização de Modelos:** Migração de todos os endpoints para `gemini-2.0-flash-exp` para máxima velocidade.
