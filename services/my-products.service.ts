// services/my-products.service.ts
import { Database } from '@/types/database.types';

export type MyProduct = Database['public']['Tables']['my_products']['Row'];
export type InsertProduct = Database['public']['Tables']['my_products']['Insert'];

export const MyProductsService = {
  async getProducts(supabase: any): Promise<MyProduct[]> {
    // 1. Buscar produtos do catálogo (my_products)
    const { data: catalogData, error: catalogError } = await supabase
      .from('my_products')
      .select('*')
      .order('name', { ascending: true });

    if (catalogError) throw new Error(`Erro ao buscar catálogo: ${catalogError.message}`);

    // 2. Buscar itens únicos de todas as listas que o usuário tem acesso
    // Nota: O RLS já garante que só vemos o que temos acesso.
    const { data: listItemsData, error: listItemsError } = await supabase
      .from('items')
      .select('name, category, unit');

    if (listItemsError) throw new Error(`Erro ao buscar itens de listas: ${listItemsError.message}`);

    // 3. Consolidação e Deduplicação (Case-Insensitive por nome)
    const inventoryMap = new Map<string, MyProduct>();

    // Prioridade 1: Itens das listas (base)
    listItemsData?.forEach((item: any) => {
      const key = item.name.trim().toLowerCase();
      if (!inventoryMap.has(key)) {
        inventoryMap.set(key, {
          id: `item-${key}`, // ID temporário para itens de lista
          user_id: '', 
          name: item.name,
          category: item.category,
          brand: null,
          barcode: null,
          image_url: null,
          metadata: {},
          last_price: null,
          created_at: '',
          updated_at: ''
        } as MyProduct);
      }
    });

    // Prioridade 2: Catálogo (Sobrescreve itens de lista com dados mais ricos como Brand/Image)
    catalogData?.forEach((prod: MyProduct) => {
      const key = prod.name.trim().toLowerCase();
      inventoryMap.set(key, prod);
    });

    return Array.from(inventoryMap.values()).sort((a, b) => 
      a.name.localeCompare(b.name)
    );
  },

  // Busca APENAS os produtos que o usuário cadastrou manualmente
  async getMyRegisteredProducts(supabase: any): Promise<MyProduct[]> {
    const { data, error } = await supabase
      .from('my_products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Erro ao buscar produtos registrados: ${error.message}`);
    return data || [];
  },

  // Busca produtos do catálogo global
  async getGlobalProducts(supabase: any): Promise<any[]> {
    const { data, error } = await supabase
      .from('global_products')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Erro ao buscar catálogo global: ${error.message}`);
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
  },

  async updateProduct(supabase: any, productId: string, updates: Partial<MyProduct>): Promise<MyProduct> {
    const { data, error } = await supabase
      .from('my_products')
      .update(updates)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw new Error(`Erro ao atualizar produto: ${error.message}`);
    return data;
  },

  // Admin Only: Promover um produto de usuário para o catálogo global
  async promoteToGlobal(supabase: any, product: Partial<MyProduct>): Promise<any> {
    const { data, error } = await supabase
      .from('global_products')
      .upsert({
        name: product.name,
        category: product.category,
        default_unit: product.default_unit || 'un',
        image_url: product.image_url
      }, { onConflict: 'name' })
      .select()
      .single();

    if (error) throw new Error(`Erro ao promover produto: ${error.message}`);
    return data;
  },

  // Admin Only: Buscar todos os produtos de todos os usuários para curadoria
  async getAllUserProducts(supabase: any): Promise<MyProduct[]> {
    const { data, error } = await supabase
      .from('my_products')
      .select('*, profiles(full_name, email)')
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Erro na curadoria: ${error.message}`);
    return data || [];
  }
};
