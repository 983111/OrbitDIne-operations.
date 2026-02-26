export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      feedback: {
        Row: {
          comment: string | null
          created_at: string
          customer_name: string | null
          id: string
          order_id: string | null
          rating: number
          restaurant_id: string
          status: string
          table_number: number | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          order_id?: string | null
          rating: number
          restaurant_id: string
          status?: string
          table_number?: number | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          customer_name?: string | null
          id?: string
          order_id?: string | null
          rating?: number
          restaurant_id?: string
          status?: string
          table_number?: number | null
        }
      }
      manager_permissions: {
        Row: {
          edit_menu: boolean
          id: string
          issue_refunds: boolean
          manage_tables: boolean
          manager_id: string
          restaurant_id: string
          view_analytics: boolean
        }
        Insert: {
          edit_menu?: boolean
          id?: string
          issue_refunds?: boolean
          manage_tables?: boolean
          manager_id: string
          restaurant_id: string
          view_analytics?: boolean
        }
        Update: {
          edit_menu?: boolean
          id?: string
          issue_refunds?: boolean
          manage_tables?: boolean
          manager_id?: string
          restaurant_id?: string
          view_analytics?: boolean
        }
      }
      menu_categories: {
        Row: {
          display_order: number
          id: string
          name: string
          restaurant_id: string
        }
        Insert: {
          display_order?: number
          id?: string
          name: string
          restaurant_id: string
        }
        Update: {
          display_order?: number
          id?: string
          name?: string
          restaurant_id?: string
        }
      }
      menu_items: {
        Row: {
          category_id: string | null
          created_at: string
          id: string
          image_url: string | null
          name: string
          price: number
          restaurant_id: string
          status: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name: string
          price: number
          restaurant_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          name?: string
          price?: number
          restaurant_id?: string
          status?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          created_at: string
          customizations: string[] | null
          id: string
          menu_item_id: string | null
          name: string
          order_id: string
          price: number
          status: string
        }
        Insert: {
          created_at?: string
          customizations?: string[] | null
          id?: string
          menu_item_id?: string | null
          name: string
          order_id: string
          price: number
          status?: string
        }
        Update: {
          created_at?: string
          customizations?: string[] | null
          id?: string
          menu_item_id?: string | null
          name?: string
          order_id?: string
          price?: number
          status?: string
        }
      }
      orders: {
        Row: {
          created_at: string
          id: string
          restaurant_id: string
          status: string
          table_id: string
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          restaurant_id: string
          status?: string
          table_id: string
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          restaurant_id?: string
          status?: string
          table_id?: string
          total?: number
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          restaurant_id: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          restaurant_id?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          restaurant_id?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
      }
      restaurants: {
        Row: {
          created_at: string
          id: string
          is_operational: boolean
          name: string
          theme: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_operational?: boolean
          name: string
          theme?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_operational?: boolean
          name?: string
          theme?: string
        }
      }
      tables: {
        Row: {
          created_at: string
          id: string
          number: number
          qr_code_url: string | null
          restaurant_id: string
          seats: number
        }
        Insert: {
          created_at?: string
          id?: string
          number: number
          qr_code_url?: string | null
          restaurant_id: string
          seats?: number
        }
        Update: {
          created_at?: string
          id?: string
          number?: number
          qr_code_url?: string | null
          restaurant_id?: string
          seats?: number
        }
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      my_restaurant_id: { Args: Record<never, never>; Returns: string }
      my_role: { Args: Record<never, never>; Returns: string }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
