-- supabase/schema.sql
-- Modelagem do Banco de Dados para App de Listas de Compras Colaborativas

-- Habilitar a extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Tabela de Perfis de Usuários (Estendendo o auth.users do Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  theme_preference TEXT DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Tabela de Listas de Compras
CREATE TABLE public.lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT, -- Emoji ou identificador de ícone
  color_theme TEXT DEFAULT 'blue', -- Tema de cor específico da lista
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Tabela de Colaboradores (Relacionamento N:N entre Perfis e Listas)
CREATE TABLE public.list_collaborators (
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('editor', 'viewer')) DEFAULT 'editor' NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (list_id, user_id)
);

-- 4. Tabela de Itens da Lista
CREATE TABLE public.items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES public.lists(id) ON DELETE CASCADE NOT NULL,
  added_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  quantity NUMERIC DEFAULT 1 NOT NULL,
  unit TEXT, -- ex: kg, un, litros
  is_purchased BOOLEAN DEFAULT false NOT NULL,
  purchased_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==============================================================================
-- FUNÇÕES DE AUXÍLIO PARA RLS (Para evitar recursão infinita)
-- ==============================================================================

-- Função para verificar se o usuário é dono da lista (bypassa RLS)
CREATE OR REPLACE FUNCTION public.is_list_owner(l_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.lists WHERE id = l_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Função para verificar se o usuário é colaborador da lista (bypassa RLS)
CREATE OR REPLACE FUNCTION public.is_list_collaborator(l_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.list_collaborators WHERE list_id = l_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) - Regras de Segurança
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

-- Perfis: Usuários podem ler qualquer perfil (para buscar amigos), mas só podem atualizar o próprio
CREATE POLICY "Perfis são públicos para leitura" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Usuários podem atualizar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Listas: Usuário pode ver/editar listas que é dono OU que é colaborador
CREATE POLICY "Acesso de leitura a listas" ON public.lists FOR SELECT
  USING (
    auth.uid() = owner_id OR 
    public.is_list_collaborator(id)
  );

CREATE POLICY "Acesso de inserção a listas" ON public.lists FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Acesso de atualização a listas" ON public.lists FOR UPDATE
  USING (
    auth.uid() = owner_id OR 
    EXISTS (
      SELECT 1 FROM public.list_collaborators 
      WHERE list_id = public.lists.id 
      AND user_id = auth.uid() 
      AND role = 'editor'
    )
  );

CREATE POLICY "Acesso de deleção a listas" ON public.lists FOR DELETE
  USING (auth.uid() = owner_id);

-- Colaboradores: Donos podem gerenciar colaboradores, usuários podem ver colaboradores de suas listas
CREATE POLICY "Leitura de colaboradores" ON public.list_collaborators FOR SELECT
  USING (
    user_id = auth.uid() OR
    public.is_list_owner(list_id) OR
    public.is_list_collaborator(list_id)
  );

CREATE POLICY "Gerenciamento de colaboradores" ON public.list_collaborators FOR ALL
  USING (public.is_list_owner(list_id));

-- Itens: Usuários podem ver/editar itens de listas que têm acesso
CREATE POLICY "Leitura de itens" ON public.items FOR SELECT
  USING (
    public.is_list_owner(list_id) OR
    public.is_list_collaborator(list_id)
  );

CREATE POLICY "Gerenciamento de itens" ON public.items FOR ALL
  USING (
    public.is_list_owner(list_id) OR
    EXISTS (
      SELECT 1 FROM public.list_collaborators 
      WHERE list_id = public.items.list_id 
      AND user_id = auth.uid() 
      AND role = 'editor'
    )
  );

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_lists_modtime BEFORE UPDATE ON public.lists FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
CREATE TRIGGER update_items_modtime BEFORE UPDATE ON public.items FOR EACH ROW EXECUTE PROCEDURE update_modified_column();
