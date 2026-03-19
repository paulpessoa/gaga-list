-- supabase/migrations/20260319020517_create_avatars_bucket.sql

-- 1. Criar o bucket de avatars (se não existir)
-- Nota: buckets são da tabela storage.buckets
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de segurança (RLS) para o bucket 'avatars'

-- Permitir leitura pública (para que todos vejam as fotos de perfil)
CREATE POLICY "Avatars são públicos para leitura"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Permitir que o usuário autenticado faça upload apenas para sua própria pasta
-- O caminho esperado é {user_id}/avatar.jpg
CREATE POLICY "Usuários podem fazer upload para sua própria pasta"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que o usuário atualize seus próprios arquivos
CREATE POLICY "Usuários podem atualizar seus próprios arquivos"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'avatars')
WITH CHECK ((storage.foldername(name))[1] = auth.uid()::text);

-- Permitir que o usuário delete seus próprios arquivos
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
