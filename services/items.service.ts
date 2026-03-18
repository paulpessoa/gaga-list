import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Item, InsertItem, UpdateItem } from '@/types/database.types';
import { supabaseServerClient } from '@/lib/supabase/server';

export const ItemsService = {
  async getListItems(supabase: any, listId: string): Promise<Item[]> {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { data, error } = await supabaseServerClient
      .from('items')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: true });

    if (error) throw new Error(`Erro ao buscar itens: ${error.message}`);
    return data || [];
  },

  async createItem(supabase: any, item: InsertItem): Promise<Item> {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', item.list_id)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { data, error } = await supabaseServerClient
      .from('items')
      .insert(item as any)
      .select()
      .single();

    if (error) throw new Error(`Erro ao criar item: ${error.message}`);
    return data as Item;
  },

  async updateItem(supabase: any, listId: string, itemId: string, updates: UpdateItem): Promise<Item> {
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { data, error } = await (supabaseServerClient as SupabaseClient<Database>)
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
    // Verifica se o usuário tem acesso à lista usando o client autenticado
    const { data: list, error: listError } = await supabase
      .from('lists')
      .select('id')
      .eq('id', listId)
      .single();
      
    if (listError || !list) throw new Error('Acesso negado à lista');

    const { error } = await supabaseServerClient
      .from('items')
      .delete()
      .eq('id', itemId)
      .eq('list_id', listId);

    if (error) throw new Error(`Erro ao deletar item: ${error.message}`);
  }
};
