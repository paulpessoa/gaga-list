-- supabase/migrations/20260319010800_jwt_security_no_recursion.sql
-- Isolamento de listas usando Claims do JWT para eliminar recursão de vez.

-- 1. Limpeza total de políticas
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lists', 'list_collaborators', 'items', 'profiles')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 2. POLÍTICAS DE LISTAS (Lists)
-- Acesso para o DONO: Usa apenas o UID do JWT (Sem recursão)
CREATE POLICY "Lists: Owner access" ON public.lists FOR ALL 
USING (owner_id = (select auth.uid()));

-- Acesso para o COLABORADOR: Usando uma política que não verifica a tabela Lists recursivamente
-- Usamos SECURITY DEFINER em uma função auxiliar para bypassar o RLS na verificação de colaboração
CREATE OR REPLACE FUNCTION public.check_collab(l_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.list_collaborators 
    WHERE list_id = l_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Lists: Collab read" ON public.lists FOR SELECT 
USING (public.check_collab(id));

-- 3. POLÍTICAS DE COLABORADORES
CREATE POLICY "Collab: Read own" ON public.list_collaborators FOR SELECT 
USING (user_id = auth.uid());

CREATE POLICY "Collab: Owner manage" ON public.list_collaborators FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.lists 
        WHERE id = public.list_collaborators.list_id AND owner_id = auth.uid()
    )
);

-- 4. POLÍTICAS DE ITENS
CREATE POLICY "Items: Access" ON public.items FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.lists 
        WHERE id = public.items.list_id AND (
            owner_id = auth.uid() OR 
            public.check_collab(public.items.list_id)
        )
    )
);
