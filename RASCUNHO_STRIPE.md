Concluí a implementação do Webhook do Stripe. Agora, o sistema está preparado para creditar os grãos automaticamente na conta do usuário assim que o pagamento for confirmado.

🛠️ O que foi feito no código:

1.  Rota de Webhook (app/api/webhooks/stripe/route.ts):
    - Criada uma rota protegida que valida a assinatura do Stripe para garantir segurança.
    - Implementada a lógica de escuta do evento checkout.session.completed.
    - O sistema agora busca o saldo atual do usuário e adiciona a quantidade de grãos comprada, usando o supabaseServerClient (admin) para garantir que a operação ocorra mesmo com RLS
      ativo.
    - Cada recarga gera um log automático na tabela ai_usage_logs com custo negativo (ex: -500), servindo como comprovante de entrada de crédito.

📋 O que você precisa fazer no Stripe Dashboard:

Para ativar o fluxo automático, siga estes passos:

1.  Configurar Webhook:
    - Vá em Developers > Webhooks no Stripe.
    - Clique em Add endpoint.
    - No campo Endpoint URL, coloque: https://seu-dominio.com/api/webhooks/stripe (substitua pelo seu domínio real quando publicar).
    - Em Select events, escolha apenas: checkout.session.completed.
2.  Obter o Segredo:
    - Após criar o endpoint, clique nele e procure por Signing secret.
    - Clique em Reveal e copie a chave (começa com whsec\_).
3.  Atualizar .env.local:
    - Adicione a chave ao seu arquivo:

1 STRIPE*WEBHOOK_SECRET=whsec*...

💡 Dica de Teste Local:
Se você quiser testar sem publicar o site, use o Stripe CLI no seu terminal:
stripe listen --forward-to localhost:3000/api/webhooks/stripe
Isso te dará um STRIPE_WEBHOOK_SECRET temporário para testar no computador.

O ciclo de pagamentos está agora totalmente automatizado. O usuário escolhe o plano, paga no Stripe, e volta para o app já com os grãos disponíveis! 🚀
