-- supabase/migrations/20260321153000_viral_sharing_fix.sql
-- Description: Allows collaborators to invite others (viral growth) while keeping owner-only management.

-- 1. Refine list_invite_tokens (QR Code Sharing)
DROP POLICY IF EXISTS "Donos podem gerenciar tokens de convite" ON public.list_invite_tokens;

CREATE POLICY "Membros podem gerenciar tokens de convite" ON public.list_invite_tokens
FOR ALL
USING (
  public.is_list_owner(list_id) OR 
  public.is_list_collaborator(list_id)
);

-- 2. Refine list_collaborators (Invite and Remove)
-- Drop the too broad policy from previous migration
DROP POLICY IF EXISTS "Gerenciamento de colaboradores" ON public.list_collaborators;
DROP POLICY IF EXISTS "Collab: Select members" ON public.list_collaborators;
DROP POLICY IF EXISTS "Collab: Owner manage" ON public.list_collaborators;
DROP POLICY IF EXISTS "Collaborators: select access" ON public.list_collaborators;
DROP POLICY IF EXISTS "Collaborators: manage access" ON public.list_collaborators;

-- New granular policies
CREATE POLICY "Collab: Select" ON public.list_collaborators
FOR SELECT
USING (
  public.is_list_owner(list_id) OR 
  public.is_list_collaborator(list_id)
);

CREATE POLICY "Collab: Insert" ON public.list_collaborators
FOR INSERT
WITH CHECK (
  public.is_list_owner(list_id) OR 
  public.is_list_collaborator(list_id)
);

CREATE POLICY "Collab: Delete self or owner delete any" ON public.list_collaborators
FOR DELETE
USING (
  public.is_list_owner(list_id) OR 
  auth.uid() = user_id
);
