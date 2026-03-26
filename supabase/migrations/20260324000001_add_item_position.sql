-- supabase/migrations/20260324000001_add_item_position.sql
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Atualizar o índice para garantir que a busca por ordem seja rápida
CREATE INDEX IF NOT EXISTS idx_items_list_position ON public.items (list_id, position ASC, created_at DESC);
