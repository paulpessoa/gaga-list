// services/my-products.service.ts
import { Database } from '@/types/database.types';

export type MyProduct = Database['public']['Tables']['my_products']['Row'];
export type InsertProduct = Database['public']['Tables']['my_products']['Insert'];

export const MyProductsService = {
  async getProducts(supabase: any): Promise<MyProduct[]> {
    const { data, error } = await supabase
      .from('my_products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Erro ao buscar meus produtos: ${error.message}`);
    return data || [];
  },

  async addProduct(supabase: any, product: InsertProduct): Promise<MyProduct> {
    const { data, error } = await supabase
      .from('my_products')
      .insert(product)
      .select()
      .single();

    if (error) throw new Error(`Erro ao salvar produto: ${error.message}`);
    return data;
  },

  async deleteProduct(supabase: any, productId: string): Promise<void> {
    const { error } = await supabase
      .from('my_products')
      .delete()
      .eq('id', productId);

    if (error) throw new Error(`Erro ao deletar produto: ${error.message}`);
  }
};
