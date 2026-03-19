-- supabase/migrations/20260319010900_create_pending_invitations.sql
-- Tabela para rastrear convites enviados para e-mails que ainda não estão no sistema.

CREATE TABLE IF NOT EXISTS public.pending_invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  email TEXT NOT NULL,
  invited_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (list_id, email)
);

-- Ativar RLS
ALTER TABLE public.pending_invitations ENABLE ROW LEVEL SECURITY;

-- Políticas para convites pendentes
-- Ver: Apenas se eu sou o dono da lista ou quem convidou
CREATE POLICY "Pending: Select access" ON public.pending_invitations FOR SELECT 
USING (
    invited_by = auth.uid() OR 
    list_id IN (SELECT id FROM public.lists WHERE owner_id = auth.uid())
);

-- Inserir/Deletar: Apenas o dono da lista
CREATE POLICY "Pending: Manage access" ON public.pending_invitations FOR ALL 
USING (
    list_id IN (SELECT id FROM public.lists WHERE owner_id = auth.uid())
);
