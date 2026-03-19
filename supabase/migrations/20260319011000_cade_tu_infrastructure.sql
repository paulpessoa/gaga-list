-- supabase/migrations/20260319011000_cade_tu_infrastructure.sql
-- Infraestrutura para a funcionalidade "Cade-tu": Localização, Avatares e Privacidade.

-- 1. Adicionar campos de localização e preferência ao perfil
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS last_lat DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS last_lng DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS location_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Criar Bucket de Storage para Avatares (se não existir)
-- Nota: O Supabase gerencia buckets via a tabela storage.buckets
INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Políticas de Storage para o Bucket 'avatars'
-- Permitir leitura pública de avatares
CREATE POLICY "Avatar: Public read" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'avatars');

-- Permitir que usuários façam upload de seus próprios avatares
CREATE POLICY "Avatar: Self upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- Permitir que usuários atualizem/deletem seus próprios avatares
CREATE POLICY "Avatar: Self update/delete" 
ON storage.objects FOR ALL 
USING (
    bucket_id = 'avatars' AND 
    (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Funções auxiliares para cálculo de distância (Fórmula de Haversine)
-- Esta função retorna a distância em metros entre dois pontos (lat1, lng1) e (lat2, lng2)
CREATE OR REPLACE FUNCTION public.calculate_distance(
  lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION, 
  lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION AS $$
DECLARE
  R DOUBLE PRECISION := 6371000; -- Raio da Terra em metros
  dLat DOUBLE PRECISION := radians(lat2 - lat1);
  dLon DOUBLE PRECISION := radians(lon2 - lon1);
  a DOUBLE PRECISION;
  c DOUBLE PRECISION;
BEGIN
  a := sin(dLat/2) * sin(dLat/2) +
       cos(radians(lat1)) * cos(radians(lat2)) * 
       sin(dLon/2) * sin(dLon/2);
  c := 2 * atan2(sqrt(a), sqrt(1-a));
  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;
