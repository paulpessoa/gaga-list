// types/database.types.ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      lists: {
        Row: {
          id: string;
          owner_id: string;
          title: string;
          description: string | null;
          icon: string | null;
          color_theme: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id: string;
          title: string;
          description?: string | null;
          icon?: string | null;
          color_theme?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string;
          title?: string;
          description?: string | null;
          icon?: string | null;
          color_theme?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      items: {
        Row: {
          id: string;
          list_id: string;
          added_by: string | null;
          name: string;
          quantity: number;
          unit: string | null;
          is_purchased: boolean;
          purchased_by: string | null;
          category: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          added_by?: string | null;
          name: string;
          quantity?: number;
          unit?: string | null;
          is_purchased?: boolean;
          purchased_by?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          added_by?: string | null;
          name?: string;
          quantity?: number;
          unit?: string | null;
          is_purchased?: boolean;
          purchased_by?: string | null;
          category?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      list_collaborators: {
        Row: {
          list_id: string;
          user_id: string;
          role: string;
          joined_at: string;
        };
        Insert: {
          list_id: string;
          user_id: string;
          role?: string;
          joined_at?: string;
        };
        Update: {
          list_id?: string;
          user_id?: string;
          role?: string;
          joined_at?: string;
        };
      };
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          theme_preference: string | null;
          location_enabled: boolean;
          phone: string | null;
          allow_notifications: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          theme_preference?: string | null;
          location_enabled?: boolean;
          phone?: string | null;
          allow_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          theme_preference?: string | null;
          location_enabled?: boolean;
          phone?: string | null;
          allow_notifications?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      list_messages: {
        Row: {
          id: string;
          list_id: string;
          user_id: string;
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          list_id: string;
          user_id: string;
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          list_id?: string;
          user_id?: string;
          content?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type List = Database['public']['Tables']['lists']['Row'];
export type InsertList = Database['public']['Tables']['lists']['Insert'];
export type UpdateList = Database['public']['Tables']['lists']['Update'];

export type Item = Database['public']['Tables']['items']['Row'];
export type InsertItem = Database['public']['Tables']['items']['Insert'];
export type UpdateItem = Database['public']['Tables']['items']['Update'];

export type Profile = Database['public']['Tables']['profiles']['Row'];

export interface Collaborator {
  user_id?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  profiles: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    phone?: string | null;
    allow_notifications?: boolean;
  };
}
