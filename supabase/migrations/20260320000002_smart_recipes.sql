-- supabase/migrations/20260320000002_smart_recipes.sql
-- Description: Creates table for storing AI-generated recipes.

CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  ingredients JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {name, quantity}
  instructions JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of strings
  prep_time TEXT,
  difficulty TEXT,
  image_url TEXT,
  ai_metadata JSONB DEFAULT '{}'::jsonb, -- Store benefits, trivia, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own recipes" ON public.recipes
FOR ALL USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_recipes_modtime 
BEFORE UPDATE ON public.recipes 
FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
