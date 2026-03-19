-- supabase/migrations/20260319021602_add_profile_insert_policy.sql

-- Adicionar política de inserção para permitir que usuários criem seu próprio perfil
CREATE POLICY "Usuários podem inserir próprio perfil" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);
