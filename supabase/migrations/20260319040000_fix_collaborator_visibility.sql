-- supabase/migrations/20260319040000_fix_collaborator_visibility.sql

-- 1. Remover a política restritiva anterior
DROP POLICY IF EXISTS "Collab: Read own" ON public.list_collaborators;

-- 2. Criar uma nova política que permite visibilidade total entre membros da mesma lista
-- Usamos uma subquery simples para evitar recursão infinita
CREATE POLICY "Collab: Visibility between members" ON public.list_collaborators
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM public.list_collaborators lc WHERE lc.list_id = public.list_collaborators.list_id
    )
    OR 
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = public.list_collaborators.list_id AND owner_id = auth.uid()
    )
  );

-- 3. Garantir que a política de gerenciamento (INSERT/DELETE) continue apenas para o dono
-- (Essa política já deve existir, mas vamos reforçar a clareza)
DROP POLICY IF EXISTS "Collab: Owner manage" ON public.list_collaborators;
CREATE POLICY "Collab: Owner manage" ON public.list_collaborators
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = public.list_collaborators.list_id AND owner_id = auth.uid()
    )
  );
