export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_usage_logs: {
        Row: {
          cost: number
          created_at: string
          feature: string
          id: string
          model_used: string | null
          user_id: string | null
        }
        Insert: {
          cost: number
          created_at?: string
          feature: string
          id?: string
          model_used?: string | null
          user_id?: string | null
        }
        Update: {
          cost?: number
          created_at?: string
          feature?: string
          id?: string
          model_used?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          added_by: string | null
          category: string | null
          checked_at: string | null
          checked_by: string | null
          created_at: string
          id: string
          is_purchased: boolean
          list_id: string
          name: string
          notes: string | null
          price: number | null
          purchased_by: string | null
          quantity: number
          unit: string | null
          updated_at: string
        }
        Insert: {
          added_by?: string | null
          category?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean
          list_id: string
          name: string
          notes?: string | null
          price?: number | null
          purchased_by?: string | null
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Update: {
          added_by?: string | null
          category?: string | null
          checked_at?: string | null
          checked_by?: string | null
          created_at?: string
          id?: string
          is_purchased?: boolean
          list_id?: string
          name?: string
          notes?: string | null
          price?: number | null
          purchased_by?: string | null
          quantity?: number
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "items_added_by_fkey"
            columns: ["added_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_checked_by_fkey"
            columns: ["checked_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "items_purchased_by_fkey"
            columns: ["purchased_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_collaborators: {
        Row: {
          joined_at: string
          list_id: string
          role: string
          user_id: string
        }
        Insert: {
          joined_at?: string
          list_id: string
          role?: string
          user_id: string
        }
        Update: {
          joined_at?: string
          list_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_collaborators_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_invite_tokens: {
        Row: {
          created_at: string
          created_by: string
          expires_at: string
          id: string
          list_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          expires_at?: string
          id?: string
          list_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          expires_at?: string
          id?: string
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_invite_tokens_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      list_messages: {
        Row: {
          content: string
          created_at: string
          id: string
          list_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          list_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          list_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "list_messages_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          color_theme: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          icon: string | null
          id: string
          owner_id: string
          title: string
          updated_at: string
        }
        Insert: {
          color_theme?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          owner_id: string
          title: string
          updated_at?: string
        }
        Update: {
          color_theme?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          owner_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      my_products: {
        Row: {
          barcode: string | null
          brand: string | null
          category: string | null
          created_at: string
          id: string
          image_url: string | null
          last_price: number | null
          metadata: Json
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          last_price?: number | null
          metadata?: Json
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          barcode?: string | null
          brand?: string | null
          category?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          last_price?: number | null
          metadata?: Json
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "my_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_invitations: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string | null
          list_id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by?: string | null
          list_id: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string | null
          list_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_invitations_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pending_invitations_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allow_notifications: boolean | null
          avatar_url: string | null
          created_at: string
          credits: number | null
          email: string
          full_name: string | null
          id: string
          is_admin: boolean | null
          last_lat: number | null
          last_lng: number | null
          location_enabled: boolean | null
          location_updated_at: string | null
          phone: string | null
          push_subscription: Json | null
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          allow_notifications?: boolean | null
          avatar_url?: string | null
          created_at?: string
          credits?: number | null
          email: string
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          last_lat?: number | null
          last_lng?: number | null
          location_enabled?: boolean | null
          location_updated_at?: string | null
          phone?: string | null
          push_subscription?: Json | null
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          allow_notifications?: boolean | null
          avatar_url?: string | null
          created_at?: string
          credits?: number | null
          email?: string
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_lat?: number | null
          last_lng?: number | null
          location_enabled?: boolean | null
          location_updated_at?: string | null
          phone?: string | null
          push_subscription?: Json | null
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      recipes: {
        Row: {
          ai_metadata: Json
          created_at: string
          description: string | null
          difficulty: string | null
          id: string
          image_url: string | null
          ingredients: Json
          instructions: Json
          prep_time: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_metadata?: Json
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          prep_time?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_metadata?: Json
          created_at?: string
          description?: string | null
          difficulty?: string | null
          id?: string
          image_url?: string | null
          ingredients?: Json
          instructions?: Json
          prep_time?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_distance: {
        Args: {
          lat1: number
          lat2: number
          lon1: number
          lon2: number
        }
        Returns: number
      }
      check_collab: {
        Args: {
          l_id: string
        }
        Returns: boolean
      }
      create_list: {
        Args: {
          p_description?: string
          p_title: string
        }
        Returns: {
          id: string
        }[]
      }
      is_list_collaborator: {
        Args: {
          l_id: string
        }
        Returns: boolean
      }
      is_list_owner: {
        Args: {
          l_id: string
        }
        Returns: boolean
      }
      join_list_via_token: {
        Args: {
          token_uuid: string
        }
        Returns: string
      }
      permanently_delete_old_lists: {
        Args: never
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
