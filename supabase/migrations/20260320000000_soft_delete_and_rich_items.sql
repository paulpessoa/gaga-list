-- Migration: Soft Delete and Rich Items
-- Description: Adds deleted_at to lists for soft delete and enriched fields to items for grocery experience.

-- 1. Add soft delete to lists
ALTER TABLE public.lists ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;

-- 2. Add enriched fields to items
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS price DECIMAL(12,2);
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS checked_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS checked_at TIMESTAMP WITH TIME ZONE;

-- 3. Update RLS for lists to handle soft delete (Optional: keeping it simple for now as per spec)
-- We will handle filtering in the application layer or via views if needed.

-- 4. Create a function to permanently delete old lists (for pg_cron)
CREATE OR REPLACE FUNCTION public.permanently_delete_old_lists()
RETURNS void AS $$
BEGIN
  DELETE FROM public.lists
  WHERE deleted_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment on how to enable pg_cron if needed:
-- SELECT cron.schedule('delete-old-lists', '0 0 * * *', 'SELECT public.permanently_delete_old_lists()');
