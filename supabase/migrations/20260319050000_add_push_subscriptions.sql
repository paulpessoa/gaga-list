-- supabase/migrations/20260319050000_add_push_subscriptions.sql

-- Adicionar coluna para armazenar a assinatura de Push do navegador
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS push_subscription JSONB;

-- Comentário para documentação técnica
COMMENT ON COLUMN public.profiles.push_subscription IS 'Armazena a assinatura Web Push do dispositivo do usuário para notificações em background.';
