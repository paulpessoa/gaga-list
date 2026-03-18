import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Item, InsertItem, UpdateItem } from '@/types/database.types';

export const ITEMS_QUERY_KEY = (listId: string) => ['items', listId];

export function useItems(listId: string) {
  return useQuery({
    queryKey: ITEMS_QUERY_KEY(listId),
    queryFn: async () => {
      const response = await fetch(`/api/lists/${listId}/items`);
      if (!response.ok) {
        throw new Error('Erro ao buscar itens');
      }
      const { data } = await response.json();
      return data as Item[];
    },
    refetchInterval: 5000,
  });
}

export function useCreateItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (newItem: Partial<InsertItem>) => {
      const response = await fetch(`/api/lists/${listId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newItem),
      });
      if (!response.ok) {
        throw new Error('Erro ao criar item');
      }
      const { data } = await response.json();
      return data as Item;
    },
    onMutate: async (newItem) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY(listId) });
      const previousItems = queryClient.getQueryData<Item[]>(ITEMS_QUERY_KEY(listId));
      
      if (previousItems) {
        queryClient.setQueryData<Item[]>(ITEMS_QUERY_KEY(listId), [
          ...previousItems,
          { ...newItem, id: Math.random().toString(), list_id: listId, created_at: new Date().toISOString() } as Item,
        ]);
      }
      return { previousItems };
    },
    onError: (err, newItem, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY(listId), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY(listId) });
    },
  });
}

export function useUpdateItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ itemId, updates }: { itemId: string; updates: UpdateItem }) => {
      const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (!response.ok) {
        throw new Error('Erro ao atualizar item');
      }
      const { data } = await response.json();
      return data as Item;
    },
    onMutate: async ({ itemId, updates }) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY(listId) });
      const previousItems = queryClient.getQueryData<Item[]>(ITEMS_QUERY_KEY(listId));
      
      if (previousItems) {
        queryClient.setQueryData<Item[]>(ITEMS_QUERY_KEY(listId), 
          previousItems.map(item => item.id === itemId ? { ...item, ...updates } : item)
        );
      }
      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY(listId), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY(listId) });
    },
  });
}

export function useDeleteItem(listId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const response = await fetch(`/api/lists/${listId}/items/${itemId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Erro ao deletar item');
      }
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: ITEMS_QUERY_KEY(listId) });
      const previousItems = queryClient.getQueryData<Item[]>(ITEMS_QUERY_KEY(listId));
      
      if (previousItems) {
        queryClient.setQueryData<Item[]>(ITEMS_QUERY_KEY(listId), 
          previousItems.filter(item => item.id !== itemId)
        );
      }
      return { previousItems };
    },
    onError: (err, variables, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData(ITEMS_QUERY_KEY(listId), context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ITEMS_QUERY_KEY(listId) });
    },
  });
}
