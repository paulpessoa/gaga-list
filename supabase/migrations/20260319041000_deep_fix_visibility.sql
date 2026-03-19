-- supabase/migrations/20260319041000_deep_fix_visibility.sql

-- 1. Limpar políticas antigas e problemáticas de colaboradores
DROP POLICY IF EXISTS "Collab: Visibility between members" ON public.list_collaborators;
DROP POLICY IF EXISTS "Collab: Read own" ON public.list_collaborators;
DROP POLICY IF EXISTS "Collab: Select" ON public.list_collaborators;

-- 2. Nova política de leitura de colaboradores usando funções SECURITY DEFINER
-- Isso evita recursão e garante que qualquer membro veja o grupo todo
CREATE POLICY "Collab: Select members" ON public.list_collaborators
  FOR SELECT
  USING (
    public.is_list_owner(list_id) OR
    public.is_list_collaborator(list_id)
  );

-- 3. AJUSTE CRÍTICO: Permitir ver perfis de colegas de lista
-- Sem isso, o nome e a foto dos outros colaboradores não aparecem para o convidado
DROP POLICY IF EXISTS "Profiles: Visibility between colleagues" ON public.profiles;
CREATE POLICY "Profiles: Visibility between colleagues" ON public.profiles
  FOR SELECT
  USING (
    id = auth.uid() OR
    id IN (
      SELECT user_id 
      FROM public.list_collaborators 
      WHERE list_id IN (
        SELECT list_id FROM public.list_collaborators WHERE user_id = auth.uid()
        UNION
        SELECT id FROM public.lists WHERE owner_id = auth.uid()
      )
    )
  );

-- 4. Garantir que a política de gerenciamento de colaboradores continue apenas para o dono
DROP POLICY IF EXISTS "Collab: Owner manage" ON public.list_collaborators;
CREATE POLICY "Collab: Owner manage" ON public.list_collaborators
  FOR ALL
  USING (public.is_list_owner(list_id));
