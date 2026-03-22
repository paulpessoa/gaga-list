# 📓 DIÁRIO DE DESENVOLVIMENTO (Project Journal)
*Histórico de marcos e decisões técnicas importantes.*

## 🗓️ 22 de Março de 2026
- **Inventory Pivot:** Exclusão completa da página '/app/app/products' e limpeza de abas redundantes em receitas. Foco total em simplificação de UX.
- **Navigation Align:** Tab Bar atualizada seguindo a UI_SPECS (Listas, Receitas, Pessoas, Perfil). Link de 'Avisos' removido do menu principal.
- **Consolidação de Documentação:** Limpeza total da pasta `docs`. Introduzido o `HEARTBEAT.md` para recuperação de contexto.
- **Resiliência de IA:** Implementado fallback de texto bruto no Vision/OCR. Melhorada a estruturação de prompts para garantir objetos JSON válidos.
- **Segurança de Créditos:** Finalizada a integração de bloqueio de IA baseado em grãos (créditos) no `ListDetail`.

## 🗓️ 21 de Março de 2026
- **Integração Stripe:** Webhook concluído. O sistema agora recarrega grãos automaticamente após pagamento confirmado.
- **Admin Panel:** Flag `is_admin` funcional. Botão de acesso exclusivo no perfil para administradores.

## 🗓️ 20 de Março de 2026
- **Testes de IA:** Validação 100% de Vision (Red Bull Test), OCR (Lista Manuscrita), Voice (Gemini Extraction) e Recipes.
- **Atualização de Modelos:** Migração de todos os endpoints para `gemini-2.0-flash-exp` para máxima velocidade.
