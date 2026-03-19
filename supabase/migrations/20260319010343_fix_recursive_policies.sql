-- supabase/migrations/20260319010343_fix_recursive_policies.sql
-- Correção de políticas recursivas para a tabela public.lists e public.list_collaborators

-- 1. Limpar as funções que causam recursão indireta (elas chamam SELECT na própria tabela protegida)
DROP FUNCTION IF EXISTS public.is_list_owner(UUID);
DROP FUNCTION IF EXISTS public.is_list_collaborator(UUID);

-- 2. Limpar todas as políticas atuais de Listas
DROP POLICY IF EXISTS "Acesso de leitura a listas" ON public.lists;
DROP POLICY IF EXISTS "Acesso de inserção a listas" ON public.lists;
DROP POLICY IF EXISTS "Acesso de atualização a listas" ON public.lists;
DROP POLICY IF EXISTS "Acesso de deleção a listas" ON public.lists;

-- 3. Limpar políticas de Colaboradores
DROP POLICY IF EXISTS "Leitura de colaboradores" ON public.list_collaborators;
DROP POLICY IF EXISTS "Gerenciamento de colaboradores" ON public.list_collaborators;

-- 4. Limpar políticas de Itens
DROP POLICY IF EXISTS "Leitura de itens" ON public.items;
DROP POLICY IF EXISTS "Gerenciamento de itens" ON public.items;

-- ==============================================================================
-- NOVAS POLÍTICAS (PADRÃO OURO - SEM RECURSÃO)
-- ==============================================================================

-- 4.1 LISTAS
-- Leitura: Dono ou se UID está na tabela de colaboradores (subquery direta)
CREATE POLICY "Lists: select access" ON public.lists FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.list_collaborators 
      WHERE list_id = public.lists.id 
      AND user_id = auth.uid()
    )
  );

-- Inserção: Só o dono (o owner_id deve ser o auth.uid())
CREATE POLICY "Lists: insert access" ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Atualização: Só o dono
CREATE POLICY "Lists: update access" ON public.lists FOR UPDATE
  USING (auth.uid() = owner_id);

-- Deleção: Só o dono
CREATE POLICY "Lists: delete access" ON public.lists FOR DELETE
  USING (auth.uid() = owner_id);

-- 4.2 COLABORADORES
-- Leitura: Registro é do próprio usuário OU usuário é o dono da lista vinculada
CREATE POLICY "Collaborators: select access" ON public.list_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = public.list_collaborators.list_id 
      AND owner_id = auth.uid()
    )
  );

-- Gerenciamento: Só o dono da lista pode mexer na tabela de colaboradores
CREATE POLICY "Collaborators: manage access" ON public.list_collaborators FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = public.list_collaborators.list_id 
      AND owner_id = auth.uid()
    )
  );

-- 4.3 ITENS
-- Leitura: Usuário é dono ou colaborador da lista
CREATE POLICY "Items: select access" ON public.items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = public.items.list_id 
      AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.list_collaborators 
          WHERE list_id = public.items.list_id 
          AND user_id = auth.uid()
        )
      )
    )
  );

-- Gerenciamento: Usuário é dono ou colaborador da lista
CREATE POLICY "Items: manage access" ON public.items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.lists 
      WHERE id = public.items.list_id 
      AND (
        owner_id = auth.uid() OR 
        EXISTS (
          SELECT 1 FROM public.list_collaborators 
          WHERE list_id = public.items.list_id 
          AND user_id = auth.uid()
        )
      )
    )
  );
