-- supabase/migrations/20260322000000_credits_and_admin.sql
-- Description: Adds 'credits' (Grãos) for gamified AI usage and 'is_admin' for the backoffice.

-- 1. Add columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- 2. Create AI Usage Log Table (for Admin tracking)
CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    feature TEXT NOT NULL, -- e.g., 'ocr', 'recipe', 'vision'
    cost INTEGER NOT NULL, -- how many 'grãos' were spent
    model_used TEXT, -- e.g., 'gemini-1.5-flash', 'whisper-large-v3'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. RLS for AI Usage Logs
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- Users can see their own logs
CREATE POLICY "Users can view own usage logs" ON public.ai_usage_logs
FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all logs (we use a function to check if the user is an admin)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE POLICY "Admins can view all usage logs" ON public.ai_usage_logs
FOR SELECT USING (public.is_admin());

-- System can insert logs (via service role or authenticated users via API)
CREATE POLICY "Authenticated users can insert logs" ON public.ai_usage_logs
FOR INSERT WITH CHECK (auth.uid() = user_id);
