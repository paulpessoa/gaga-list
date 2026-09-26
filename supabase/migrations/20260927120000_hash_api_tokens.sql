-- Tokens passam a ser armazenados como SHA-256 (hex). Converte os tokens antigos, salvos em texto puro.
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

UPDATE public.api_tokens
SET token_hash = encode(extensions.digest(token_hash, 'sha256'), 'hex')
WHERE token_hash LIKE 'gl_live_%';
