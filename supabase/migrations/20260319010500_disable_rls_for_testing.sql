-- supabase/migrations/20260319010500_disable_rls_for_testing.sql
-- Desabilitando RLS temporariamente para testes de fluxo

ALTER TABLE public.lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_collaborators DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
