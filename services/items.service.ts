import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Item, InsertItem, UpdateItem } from '@/types/database.types';
import { supabaseServerClient } from '@/lib/supabase/server';

export const ItemsService = {
  async getListItems(supabase: any, listId: string): Promise<Item[]> {
    const { data, error } = await supabase
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

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
