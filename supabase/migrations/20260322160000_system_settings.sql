-- Migration: Configurações Dinâmicas do Sistema
-- Descrição: Armazena custos de IA, preços de planos e flags de funcionalidade.

CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Habilitar RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Política: Apenas administradores podem ler e escrever
CREATE POLICY "Admins can manage system_settings" 
ON public.system_settings
FOR ALL 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_admin = true
    )
);

-- Política: Qualquer usuário autenticado pode ler (para o app saber o custo)
CREATE POLICY "Authenticated users can read settings" 
ON public.system_settings
FOR SELECT 
TO authenticated
USING (true);

-- Inserir valores padrão iniciais
INSERT INTO public.system_settings (key, value, description) VALUES
('cost_recipe', '1', 'Custo em grãos para gerar uma receita'),
('cost_ocr', '2', 'Custo em grãos para ler uma foto de lista'),
('cost_vision', '1', 'Custo em grãos para identificar um produto por foto'),
('cost_voice', '1', 'Custo em grãos para processar comando de voz'),
('cost_suggestion', '1', 'Custo em grãos para sugestões inteligentes'),
('referral_bonus', '50', 'Bônus de grãos para quem indica um amigo')
ON CONFLICT (key) DO NOTHING;
