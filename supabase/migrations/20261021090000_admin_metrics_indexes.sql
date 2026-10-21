-- Migration OPCIONAL: índices para as consultas do painel /admin.
-- O painel funciona SEM esta migration; ela só deixa as consultas por data
-- mais rápidas quando a base crescer. Idempotente (IF NOT EXISTS) e sem
-- alteração de dados, colunas ou políticas RLS.

CREATE INDEX IF NOT EXISTS idx_profiles_created_at      ON public.profiles (created_at);
CREATE INDEX IF NOT EXISTS idx_lists_created_at         ON public.lists (created_at);
CREATE INDEX IF NOT EXISTS idx_items_created_at         ON public.items (created_at);
CREATE INDEX IF NOT EXISTS idx_items_checked_at         ON public.items (checked_at) WHERE checked_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_items_added_by           ON public.items (added_by);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_created_at ON public.ai_usage_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_logs_user_id    ON public.ai_usage_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_list_messages_created_at ON public.list_messages (created_at);
