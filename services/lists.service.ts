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
  async getUserLists(userId: string): Promise<List[]> {
    // Como estamos usando a Service Key (que ignora RLS), precisamos
    // aplicar a lógica de segurança (filtro por usuário) manualmente na query.
    
    // Busca listas onde o usuário é dono
    const { data: ownedLists, error: ownedError } = await supabaseServerClient
      .from('lists')
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (ownedError) throw new Error(`Erro ao buscar listas próprias: ${ownedError.message}`);

    // Busca listas onde o usuário é colaborador
    const { data: collabLists, error: collabError } = await supabaseServerClient
      .from('list_collaborators')
      .select('lists(*)')
      .eq('user_id', userId);

    if (collabError) throw new Error(`Erro ao buscar listas colaborativas: ${collabError.message}`);

    // Extrai as listas do resultado do join e combina com as próprias
    const sharedLists = collabLists
      .map((c: any) => c.lists)
      .filter(Boolean) as List[];

    // Remove duplicatas caso existam (embora a lógica de negócio deva prevenir)
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
  async createList(listData: InsertList): Promise<List> {
    const { data, error } = await supabaseServerClient
      .from('lists')
      .insert(listData as any)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar lista: ${error.message}`);
    return data as List;
  },

  async getCollaborators(supabase: any, listId: string) {
    const { data, error } = await supabase
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
    // Primeiro, busca o usuário pelo email
    const { data: profiles, error: profileError } = await supabaseServerClient
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (profileError || !profiles) {
      throw new Error('Usuário não encontrado');
    }

    const { data, error } = await supabase
      .from('list_collaborators')
      .insert({
        list_id: listId,
        user_id: (profiles as any).id,
        role: 'editor'
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('Usuário já é colaborador desta lista');
      }
      throw new Error(`Erro ao adicionar colaborador: ${error.message}`);
    }

    return data;
  }
};
