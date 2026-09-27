-- Non-sensitive preview (e.g. "gl_live_a1b2c3...9f3d") shown in the token list, since only the hash is stored.
ALTER TABLE public.api_tokens ADD COLUMN IF NOT EXISTS token_preview TEXT;
