// types/index.ts
import { Database } from './database.types';

// Tabelas principais (aliases para Row)
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type List = Database['public']['Tables']['lists']['Row'];
export type Item = Database['public']['Tables']['items']['Row'];
export type ListCollaborator = Database['public']['Tables']['list_collaborators']['Row'];
export type MyProduct = Database['public']['Tables']['my_products']['Row'];

// Tipos compostos (Domain Models)
export interface Collaborator extends ListCollaborator {
  profiles?: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
  } | null;
  status?: 'active' | 'pending';
}

// Tipos de Inserção/Update
export type InsertList = Database['public']['Tables']['lists']['Insert'];
export type UpdateList = Database['public']['Tables']['lists']['Update'];
export type InsertItem = Database['public']['Tables']['items']['Insert'];
export type UpdateItem = Database['public']['Tables']['items']['Update'];
export type InsertProduct = Database['public']['Tables']['my_products']['Insert'];
export type UpdateProduct = Database['public']['Tables']['my_products']['Update'];
