-- supabase/migrations/20260322100000_global_products_and_preferences.sql
-- Description: Creates global_products table and adds user preferences to my_products.

-- 1. Create global_products table (The "Master Catalog")
CREATE TABLE IF NOT EXISTS public.global_products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT,
  default_unit TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add preferences to my_products
ALTER TABLE public.my_products ADD COLUMN IF NOT EXISTS default_unit TEXT;
ALTER TABLE public.my_products ADD COLUMN IF NOT EXISTS default_notes TEXT;

-- 3. Enable RLS for global_products
ALTER TABLE public.global_products ENABLE ROW LEVEL SECURITY;

-- 4. Policies for global_products
-- Everyone can read official products
CREATE POLICY "Global products are public for reading" ON public.global_products
FOR SELECT USING (true);

-- Only Admins can manage global products
CREATE POLICY "Only admins can manage global products" ON public.global_products
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  )
);

-- 5. Trigger for updated_at
CREATE TRIGGER update_global_products_modtime 
BEFORE UPDATE ON public.global_products 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();

-- 6. Initial Seed (Populating from existing COMMON_GROCERY_ITEMS)
INSERT INTO public.global_products (name, category, default_unit)
VALUES 
  ('Carne Moída', 'Açougue', 'kg'),
  ('Peito de Frango', 'Açougue', 'kg'),
  ('Banana', 'Hortifruti', 'kg'),
  ('Maçã', 'Hortifruti', 'kg'),
  ('Leite', 'Laticínios', 'L'),
  ('Arroz', 'Mercearia', 'kg'),
  ('Feijão', 'Mercearia', 'kg')
ON CONFLICT (name) DO NOTHING;
