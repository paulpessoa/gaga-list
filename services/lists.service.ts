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
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return [];

    // Busca listas onde o usuário é dono ou colaborador usando uma única query se possível,
    // ou tratando os erros de forma silenciosa para retornar vazio.
    const { data: lists, error } = await supabase
      .from('lists')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar listas:', error.message);
      return [];
    }

    return lists || [];
  },

  /**
   * Cria uma nova lista de compras.
   * @param listData Dados da lista a ser criada
   */
  async createList(supabase: any, listData: InsertList): Promise<List> {
    const { data, error } = await supabase
      .from('lists')
      .insert(listData as any)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar lista: ${error.message}`);
    return data as List;
  },

  async updateList(supabase: any, listId: string, updates: Partial<List>): Promise<List> {
    const { data, error } = await supabase
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
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId);

    if (error) throw new Error(`Erro ao deletar lista: ${error.message}`);
  },

  async getCollaborators(supabase: any, listId: string) {
    // 1. Buscar colaboradores reais
    const { data: realCollaborators, error: realError } = await supabase
      .from('list_collaborators')
      .select(`
        user_id,
        role,
        profiles (
          id,
          email,
          full_name,
          avatar_url
        )
      `)
      .eq('list_id', listId);

    if (realError) {
      console.error('Erro ao buscar colaboradores reais:', realError.message);
    }

    // 2. Buscar convites pendentes
    const { data: pendingInvites, error: pendingError } = await supabaseServerClient
      .from('pending_invitations')
      .select('email, invited_by')
      .eq('list_id', listId);

    if (pendingError) {
      console.error('Erro ao buscar convites pendentes:', pendingError.message);
    }

    const formattedReal = (realCollaborators || []).map((collab: any) => ({
      ...collab,
      status: 'active'
    }));

    const formattedPending = (pendingInvites || []).map((invite: any) => ({
      role: 'editor',
      status: 'pending',
      profiles: {
        id: `pending-${invite.email}`,
        email: invite.email,
        full_name: 'Pendente',
        avatar_url: null
      }
    }));

    return [...formattedReal, ...formattedPending];
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
      throw new Error('USUARIO_NAO_ENCONTRADO');
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
        throw new Error('Este usuário já é colaborador desta lista');
      }
      throw new Error(`Erro ao adicionar colaborador: ${error.message}`);
    }

    return data;
  },

  /**
   * Envia um convite oficial do Supabase Auth para um novo usuário e registra o convite pendente.
   */
  async inviteUser(email: string, listId: string) {
    // 1. Enviar o convite oficial via Auth
    const { data: inviteData, error: inviteError } = await supabaseServerClient.auth.admin.inviteUserByEmail(email);
    
    if (inviteError) {
      throw new Error(`Erro ao enviar convite: ${inviteError.message}`);
    }

    // 2. Registrar o convite pendente para vinculação automática
    const { error: pendingError } = await supabaseServerClient
      .from('pending_invitations')
      .insert({
        list_id: listId,
        email: email,
        invited_by: (await supabaseServerClient.auth.getUser()).data.user?.id
      } as any);

    if (pendingError && pendingError.code !== '23505') {
      console.error('Erro ao registrar convite pendente:', pendingError.message);
    }
    
    return inviteData;
  },

  async removeCollaborator(supabase: any, listId: string, userId: string) {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    if (userId.startsWith('pending-')) {
      const email = userId.replace('pending-', '');
      const { error } = await supabaseServerClient
        .from('pending_invitations')
        .delete()
        .eq('list_id', listId)
        .eq('email', email);

      if (error) throw new Error(`Erro ao remover convite pendente: ${error.message}`);
      return true;
    }

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
