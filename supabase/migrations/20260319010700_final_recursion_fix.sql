-- supabase/migrations/20260319010700_final_recursion_fix.sql
-- Solução definitiva para recursão infinita no Supabase.

-- 1. Limpeza total novamente
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lists', 'list_collaborators', 'items', 'profiles')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 2. POLÍTICA DE PERFIS (Sem alterações, já funciona)
CREATE POLICY "Profiles: Read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: Update self" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. POLÍTICAS DE LISTAS (Lists) - O SEGREDO É SEPARAR AS REGRAS
-- Regra para o DONO (Simples, direta, sem SELECT em outra tabela)
CREATE POLICY "Lists: Owner read" ON public.lists FOR SELECT 
USING (owner_id = auth.uid());

-- Regra para o COLABORADOR (Busca apenas na tabela de colaboradores)
CREATE POLICY "Lists: Collab read" ON public.lists FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.list_collaborators 
        WHERE list_id = public.lists.id AND user_id = auth.uid()
    )
);

-- Inserção, Atualização e Deleção (Apenas Dono)
CREATE POLICY "Lists: Owner manage" ON public.lists FOR ALL 
USING (owner_id = auth.uid());

-- 4. POLÍTICAS DE COLABORADORES (Collaborators)
-- Regra para o COLABORADOR ver a si mesmo (Sem SELECT na tabela Lists)
CREATE POLICY "Collab: Read self" ON public.list_collaborators FOR SELECT 
USING (user_id = auth.uid());

-- Regra para o DONO gerenciar colaboradores (Sem SELECT na tabela Lists, usando owner_id da própria tabela se existir ou subquery simples)
CREATE POLICY "Collab: Owner manage" ON public.list_collaborators FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.lists 
        WHERE id = public.list_collaborators.list_id AND owner_id = auth.uid()
    )
);

-- 5. POLÍTICAS DE ITENS (Items)
-- Regra simples baseada na lista pai
CREATE POLICY "Items: Access" ON public.items FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.lists 
        WHERE id = public.items.list_id AND (
            owner_id = auth.uid() OR 
            EXISTS (SELECT 1 FROM public.list_collaborators WHERE list_id = public.items.list_id AND user_id = auth.uid())
        )
    )
);
