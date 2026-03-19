-- supabase/migrations/20260319030000_create_invite_tokens.sql

-- 1. Tabela para armazenar tokens de convite via QR Code
CREATE TABLE IF NOT EXISTS public.list_invite_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_id UUID NOT NULL REFERENCES public.lists(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.list_invite_tokens ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Segurança
-- Apenas o dono da lista pode gerar/ver tokens de convite
CREATE POLICY "Donos podem gerenciar tokens de convite" ON public.list_invite_tokens
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lists
      WHERE id = list_invite_tokens.list_id AND owner_id = auth.uid()
    )
  );

-- Permitir que usuários anônimos/logados leiam o token para validar o convite
CREATE POLICY "Qualquer um pode ler um token para validar" ON public.list_invite_tokens
  FOR SELECT
  USING (true);

-- 4. Função para limpar tokens expirados (opcional, para performance futura)
CREATE OR REPLACE FUNCTION public.join_list_via_token(token_uuid UUID)
RETURNS UUID AS $$
DECLARE
  v_list_id UUID;
BEGIN
  -- 1. Buscar o list_id do token válido
  SELECT list_id INTO v_list_id
  FROM public.list_invite_tokens
  WHERE id = token_uuid AND expires_at > now();

  IF v_list_id IS NULL THEN
    RAISE EXCEPTION 'Convite inválido ou expirado';
  END IF;

  -- 2. Adicionar o usuário atual como colaborador (se já não for)
  INSERT INTO public.list_collaborators (list_id, user_id, role)
  VALUES (v_list_id, auth.uid(), 'editor')
  ON CONFLICT (list_id, user_id) DO NOTHING;

  RETURN v_list_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
