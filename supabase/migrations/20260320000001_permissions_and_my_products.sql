-- supabase/migrations/20260320000001_permissions_and_my_products.sql
-- Description: Updates permissions for collaborators and creates 'my_products' table.

-- 1. Update list_collaborators policy to allow all members to invite/manage
DROP POLICY IF EXISTS "Gerenciamento de colaboradores" ON public.list_collaborators;

CREATE POLICY "Gerenciamento de colaboradores" ON public.list_collaborators 
FOR ALL
USING (
  public.is_list_owner(list_id) OR 
  public.is_list_collaborator(list_id)
);

-- 2. Create 'my_products' table for AI Scanner feature
CREATE TABLE IF NOT EXISTS public.my_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  brand TEXT,
  barcode TEXT,
  image_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  last_price NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Enable RLS for 'my_products'
ALTER TABLE public.my_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own products" ON public.my_products
FOR ALL USING (auth.uid() = user_id);

-- 4. Trigger for updated_at
CREATE TRIGGER update_my_products_modtime 
BEFORE UPDATE ON public.my_products 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
