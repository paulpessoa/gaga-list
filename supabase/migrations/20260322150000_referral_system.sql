-- Migration: Sistema de Recompensa por Indicação (50 Grãos) e Soft Delete de Perfil
-- Descrição: 
-- 1. Adiciona coluna deleted_at no perfil para exclusão programada.
-- 2. Quando um novo usuário se cadastra, verifica se ele foi convidado. 
-- 3. Se sim, o indicador ganha 50 grãos automaticamente.

-- 1. Adicionar coluna deleted_at se não existir
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'deleted_at') THEN
        ALTER TABLE public.profiles ADD COLUMN deleted_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Função de Recompensa
CREATE OR REPLACE FUNCTION public.handle_referral_reward()
RETURNS TRIGGER AS $$
DECLARE
    v_invited_by UUID;
BEGIN
    -- Verificar se o e-mail do novo perfil existe na tabela de convites pendentes
    SELECT invited_by INTO v_invited_by
    FROM public.pending_invitations
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1;

    -- Se houver um indicador, premiá-lo
    IF v_invited_by IS NOT NULL THEN
        -- Incrementar créditos do indicador
        UPDATE public.profiles
        SET credits = COALESCE(credits, 0) + 50
        WHERE id = v_invited_by;

        -- Registrar o log do bônus
        INSERT INTO public.ai_usage_logs (user_id, feature, cost, model_used)
        VALUES (v_invited_by, 'referral_bonus', -50, 'system');

        -- Remover o convite pendente para não processar duplicado
        DELETE FROM public.pending_invitations WHERE LOWER(email) = LOWER(NEW.email);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger disparada após a criação de um novo perfil
DROP TRIGGER IF EXISTS on_profile_created_referral ON public.profiles;
CREATE TRIGGER on_profile_created_referral
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.handle_referral_reward();
