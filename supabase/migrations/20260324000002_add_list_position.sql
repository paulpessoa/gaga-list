-- supabase/migrations/20260324000002_add_list_position.sql
ALTER TABLE public.lists ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Índice para busca rápida por posição na home
CREATE INDEX IF NOT EXISTS idx_lists_position ON public.lists (owner_id, position ASC, updated_at DESC);
