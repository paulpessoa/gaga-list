-- supabase/migrations/20260319010400_deep_clean_policies.sql
-- Limpeza profunda de TODAS as políticas nas tabelas críticas para eliminar a recursão de vez.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Dropar todas as políticas de public.lists
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'lists') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.lists';
    END LOOP;

    -- 2. Dropar todas as políticas de public.list_collaborators
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'list_collaborators') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.list_collaborators';
    END LOOP;

    -- 3. Dropar todas as políticas de public.items
    FOR r IN (SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'items') LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.items';
    END LOOP;
END $$;

-- Agora aplicamos as políticas LIMPAS e OTIMIZADAS (SEM RECURSÃO)

-- LISTAS
CREATE POLICY "Lists: Select" ON public.lists FOR SELECT USING (auth.uid() = owner_id OR EXISTS (SELECT 1 FROM public.list_collaborators WHERE list_id = public.lists.id AND user_id = auth.uid()));
CREATE POLICY "Lists: Insert" ON public.lists FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Lists: Update" ON public.lists FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Lists: Delete" ON public.lists FOR DELETE USING (auth.uid() = owner_id);

-- COLABORADORES
CREATE POLICY "Collab: Select" ON public.list_collaborators FOR SELECT USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.lists WHERE id = public.list_collaborators.list_id AND owner_id = auth.uid()));
CREATE POLICY "Collab: Manage" ON public.list_collaborators FOR ALL USING (EXISTS (SELECT 1 FROM public.lists WHERE id = public.list_collaborators.list_id AND owner_id = auth.uid()));

-- ITENS
CREATE POLICY "Items: Select" ON public.items FOR SELECT USING (EXISTS (SELECT 1 FROM public.lists WHERE id = public.items.list_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.list_collaborators WHERE list_id = public.items.list_id AND user_id = auth.uid()))));
CREATE POLICY "Items: Manage" ON public.items FOR ALL USING (EXISTS (SELECT 1 FROM public.lists WHERE id = public.items.list_id AND (owner_id = auth.uid() OR EXISTS (SELECT 1 FROM public.list_collaborators WHERE list_id = public.items.list_id AND user_id = auth.uid()))));
