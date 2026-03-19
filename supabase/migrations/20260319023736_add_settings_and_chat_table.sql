-- supabase/migrations/20260319023736_add_settings_and_chat_table.sql

-- 1. Evoluir a tabela de perfis com novos campos de configuração
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS allow_notifications BOOLEAN DEFAULT true;

-- 2. Criar a tabela de Mensagens (Chat com Histórico)
CREATE TABLE IF NOT EXISTS public.list_messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS para as mensagens
ALTER TABLE public.list_messages ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Segurança para o Chat
-- Apenas donos ou colaboradores da lista podem ler as mensagens
CREATE POLICY "Leitura de mensagens da lista" ON public.list_messages FOR SELECT
  USING (
    public.is_list_owner(list_id) OR
    public.is_list_collaborator(list_id)
  );

-- Apenas donos ou colaboradores da lista podem enviar mensagens
CREATE POLICY "Envio de mensagens na lista" ON public.list_messages FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND (
      public.is_list_owner(list_id) OR
      public.is_list_collaborator(list_id)
    )
  );

-- 5. Habilitar Realtime para as mensagens
-- Isso permite o 'frescor' do chat sem precisar de refresh
ALTER PUBLICATION supabase_realtime ADD TABLE public.list_messages;
