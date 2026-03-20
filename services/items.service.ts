import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';
import { Item, InsertItem, UpdateItem } from '@/types';
import { supabaseServerClient } from '@/lib/supabase/server';

export const ItemsService = {
  async getListItems(supabase: any, listId: string): Promise<(Item & { checked_by_profile?: { full_name: string | null; avatar_url: string | null } })[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*, checked_by_profile:profiles!checked_by(full_name, avatar_url)')
      .eq('list_id', listId)
      .order('is_purchased', { ascending: true }) // Itens comprados vão para o fim
      .order('created_at', { ascending: false }); // Itens novos no topo

    if (error) {
      console.error('Erro ao buscar itens:', error.message);
      return [];
    }
    return data || [];
  },

  async createItem(supabase: any, item: InsertItem): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      .insert(item as any)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar item: ${error.message}`);
    return data as Item;
  },

  async updateItem(supabase: any, listId: string, itemId: string, updates: UpdateItem): Promise<Item> {
    const { data, error } = await supabase
      .from('items')
      // @ts-ignore
      .update(updates)
      .eq('id', itemId)
      .eq('list_id', listId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar item: ${error.message}`);
    return data as Item;
  },

  async deleteItem(supabase: any, listId: string, itemId: string): Promise<void> {
    const { error } = await supabase
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('list_id', listId);

    if (error) throw new Error(`Erro ao deletar item: ${error.message}`);
  }
};
