// hooks/use-lists.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { List } from '@/types/database.types';

// Chave do cache para as listas
export const LISTS_QUERY_KEY = ['lists'];

/**
 * Hook para buscar as listas do usuário.
 */
export function useLists() {
  return useQuery({
    queryKey: LISTS_QUERY_KEY,
    queryFn: async (): Promise<List[]> => {
      const response = await fetch('/api/lists');
      if (!response.ok) {
        throw new Error('Falha ao buscar listas');
      }
      const { data } = await response.json();
      return data;
    },
    // Configurações para PWA / Offline-first
    staleTime: 1000 * 60 * 5, // Considera os dados frescos por 5 minutos
    refetchOnWindowFocus: true, // Revalida ao voltar para a aba
    refetchOnReconnect: true, // Revalida ao voltar a ter internet
  });
}

/**
 * Hook para criar uma nova lista com Atualização Otimista (Optimistic UI).
 */
export function useCreateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newList: { title: string; description?: string; color_theme?: string }) => {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newList),
      });
      
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.details || 'Falha ao criar lista');
      }
      
      const { data } = await response.json();
      return data as List;
    },
    
    // ATUALIZAÇÃO OTIMISTA
    // Executado imediatamente quando a mutação é chamada, antes da resposta do servidor
    onMutate: async (newListData) => {
      // 1. Cancela queries em andamento para não sobrescrever a atualização otimista
      await queryClient.cancelQueries({ queryKey: LISTS_QUERY_KEY });

      // 2. Salva o estado anterior para possível rollback em caso de erro
      const previousLists = queryClient.getQueryData<List[]>(LISTS_QUERY_KEY);

      // 3. Atualiza o cache otimisticamente com um ID temporário
      const optimisticList: List = {
        id: `temp-${Date.now()}`,
        owner_id: 'temp-user',
        title: newListData.title,
        description: newListData.description || null,
        color_theme: newListData.color_theme || 'blue',
        icon: '🛒',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      queryClient.setQueryData<List[]>(LISTS_QUERY_KEY, (old) => {
        return old ? [optimisticList, ...old] : [optimisticList];
      });

      // Retorna o contexto com o estado anterior
      return { previousLists };
    },
    
    // Se a mutação falhar, usa o contexto retornado no onMutate para fazer rollback
    onError: (err, newListData, context) => {
      if (context?.previousLists) {
        queryClient.setQueryData(LISTS_QUERY_KEY, context.previousLists);
      }
      // Aqui você pode disparar um toast de erro
      console.error('Erro ao criar lista, revertendo UI...', err);
    },
    
    // Sempre revalida os dados no servidor após erro ou sucesso
    // para garantir que o client tem a verdade absoluta
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
    },
  });
}

export const COLLABORATORS_QUERY_KEY = (listId: string) => ['collaborators', listId];

export function useCollaborators(listId: string) {
  return useQuery({
    queryKey: COLLABORATORS_QUERY_KEY(listId),
    queryFn: async () => {
      const response = await fetch(`/api/lists/${listId}/collaborators`);
      if (!response.ok) {
        throw new Error('Erro ao buscar colaboradores');
      }
      const { data } = await response.json();
      return data;
    },
  });
}

export function useAddCollaborator(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/lists/${listId}/collaborators`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao adicionar colaborador');
      }
      const { data } = await response.json();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY(listId) });
    },
  });
}

export function useRemoveCollaborator(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const response = await fetch(`/api/lists/${listId}/collaborators/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao remover colaborador');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLABORATORS_QUERY_KEY(listId) });
    },
  });
}

export function useUpdateList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ listId, updates }: { listId: string; updates: Partial<List> }) => {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao atualizar lista');
      }
      const { data } = await response.json();
      return data as List;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
    },
  });
}

export function useDeleteList() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listId: string) => {
      const response = await fetch(`/api/lists/${listId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao deletar lista');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: LISTS_QUERY_KEY });
    },
  });
}
