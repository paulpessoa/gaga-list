// services/lists.service.ts
import { supabaseServerClient } from '@/lib/supabase/server';
import { List, InsertList } from '@/types/database.types';

/**
 * Serviço para gerenciamento de Listas de Compras.
 * Toda a lógica de comunicação com o banco de dados fica isolada aqui.
 */
export const ListsService = {
  /**
   * Busca todas as listas de um usuário (como dono ou colaborador).
   * @param userId ID do usuário autenticado
   */
  async getUserLists(supabase: any): Promise<List[]> {
    // Pega o usuário logado do cliente autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não autenticado');

    // Busca listas onde o usuário é dono
    const { data: ownedLists, error: ownedError } = await supabase
      .from('lists')
      .select('*')
      .eq('owner_id', user.id)
      .order('created_at', { ascending: false });

    if (ownedError) throw new Error(`Erro ao buscar listas próprias: ${ownedError.message}`);

    // Busca listas onde o usuário é colaborador
    const { data: collabLists, error: collabError } = await supabase
      .from('list_collaborators')
      .select('lists(*)')
      .eq('user_id', user.id);

    if (collabError) throw new Error(`Erro ao buscar listas colaborativas: ${collabError.message}`);

    // Extrai as listas do resultado do join e combina com as próprias
    const sharedLists = collabLists
      .map((c: any) => c.lists)
      .filter(Boolean) as List[];

    // Remove duplicatas caso existam
    const allLists = [...(ownedLists || []), ...sharedLists];
    const uniqueLists = Array.from(new Map(allLists.map(item => [item.id, item])).values());

    // Ordena por data de atualização mais recente
    return uniqueLists.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    );
  },

  /**
   * Cria uma nova lista de compras.
   * @param listData Dados da lista a ser criada
   */
  async createList(supabase: any, listData: InsertList): Promise<List> {
    const { data, error } = await supabaseServerClient
      .from('lists')
      .insert(listData as any)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar lista: ${error.message}`);
    return data as List;
  },

  async updateList(supabase: any, listId: string, updates: Partial<List>): Promise<List> {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { data, error } = await supabaseServerClient
      .from('lists')
      // @ts-ignore
      .update(updates)
      .eq('id', listId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar lista: ${error.message}`);
    return data as List;
  },

  async deleteList(supabase: any, listId: string): Promise<void> {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { error } = await supabaseServerClient
      .from('lists')
      .delete()
      .eq('id', listId);

    if (error) throw new Error(`Erro ao deletar lista: ${error.message}`);
  },

  async getCollaborators(supabase: any, listId: string) {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { data, error } = await supabaseServerClient
      .from('list_collaborators')
      .select(`
        role,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('list_id', listId);

    if (error) throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
    return data;
  },

  async addCollaborator(supabase: any, listId: string, email: string) {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    // Primeiro, busca o usuário pelo email
    const { data: profiles, error: profileError } = await supabaseServerClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profiles) {
      throw new Error('Usuário não encontrado');
    }

    const { data, error } = await supabaseServerClient
      .from('list_collaborators')
      .insert({
        list_id: listId,
        user_id: (profiles as any).id,
        role: 'editor'
      } as any)
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Usuário já é colaborador desta lista');
      }
      throw new Error(`Erro ao adicionar colaborador: ${error.message}`);
    }

    return data;
  },

  async removeCollaborator(supabase: any, listId: string, userId: string) {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { error } = await supabaseServerClient
      .from('list_collaborators')
      .delete()
      .eq('list_id', listId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Erro ao remover colaborador: ${error.message}`);
    }

    return true;
  }
};
