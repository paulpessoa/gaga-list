-- supabase/migrations/20260319010600_fix_security_and_isolation.sql
-- Reabilitando RLS e aplicando políticas de isolamento total sem recursão.

-- 1. Reabilitar RLS em todas as tabelas
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Limpeza total de políticas antigas para evitar conflitos de nomes
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('lists', 'list_collaborators', 'items', 'profiles')) LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON public.' || r.tablename;
    END LOOP;
END $$;

-- 3. POLÍTICAS DE PERFIS (Profiles)
-- Usuários podem ver todos os perfis (necessário para busca/convite), mas só editam o seu
CREATE POLICY "Profiles: Public read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: Self update" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 4. POLÍTICAS DE LISTAS (Lists) - O CORAÇÃO DO ISOLAMENTO
-- Seleção: Apenas listas que eu sou dono OU que eu sou colaborador (usando subquery direta)
CREATE POLICY "Lists: Secure select" ON public.lists FOR SELECT 
USING (
    owner_id = auth.uid() OR 
    id IN (SELECT list_id FROM public.list_collaborators WHERE user_id = auth.uid())
);

-- Inserção: Apenas se eu for o dono definido no registro
CREATE POLICY "Lists: Secure insert" ON public.lists FOR INSERT 
WITH CHECK (owner_id = auth.uid());

-- Edição/Deleção: Apenas o dono da lista
CREATE POLICY "Lists: Secure owner manage" ON public.lists FOR ALL 
USING (owner_id = auth.uid());

-- 5. POLÍTICAS DE COLABORADORES (Collaborators)
-- Ver colaboradores: Apenas se eu tiver acesso à lista vinculada
CREATE POLICY "Collab: Secure select" ON public.list_collaborators FOR SELECT 
USING (
    user_id = auth.uid() OR 
    list_id IN (SELECT id FROM public.lists WHERE owner_id = auth.uid())
);

-- Gerenciar colaboradores: Apenas o dono da lista pai
CREATE POLICY "Collab: Owner manage" ON public.list_collaborators FOR ALL 
USING (
    list_id IN (SELECT id FROM public.lists WHERE owner_id = auth.uid())
);

-- 6. POLÍTICAS DE ITENS (Items)
-- Ver e gerenciar itens: Se eu tiver acesso à lista (Dono ou Colaborador)
CREATE POLICY "Items: Secure access" ON public.items FOR ALL 
USING (
    list_id IN (
        SELECT id FROM public.lists 
        WHERE owner_id = auth.uid() OR 
        id IN (SELECT list_id FROM public.list_collaborators WHERE user_id = auth.uid())
    )
);
