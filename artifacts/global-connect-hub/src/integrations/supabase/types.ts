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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      blog_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          body: string | null
          category_id: string | null
          cover_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          published: boolean
          published_at: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          category_id?: string | null
          cover_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          published?: boolean
          published_at?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "blog_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      bookings: {
        Row: {
          booking_date: string
          created_at: string
          customer_name: string | null
          description: string | null
          email: string | null
          id: string
          order_id: string | null
          payment_method: string | null
          phone: string | null
          service_name: string
          status: string
          time_slot: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          booking_date: string
          created_at?: string
          customer_name?: string | null
          description?: string | null
          email?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          phone?: string | null
          service_name: string
          status?: string
          time_slot: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          booking_date?: string
          created_at?: string
          customer_name?: string | null
          description?: string | null
          email?: string | null
          id?: string
          order_id?: string | null
          payment_method?: string | null
          phone?: string | null
          service_name?: string
          status?: string
          time_slot?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string | null
          id: string
          message: string
          name: string
          phone: string | null
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          message: string
          name: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          message?: string
          name?: string
          phone?: string | null
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      email_log: {
        Row: {
          created_at: string
          dedupe_key: string
          error_message: string | null
          event: string
          id: string
          provider_id: string | null
          recipient: string
          status: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          dedupe_key: string
          error_message?: string | null
          event: string
          id?: string
          provider_id?: string | null
          recipient: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          dedupe_key?: string
          error_message?: string | null
          event?: string
          id?: string
          provider_id?: string | null
          recipient?: string
          status?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      nav_items: {
        Row: {
          active: boolean
          created_at: string
          group_label: string | null
          href: string
          id: string
          label: string
          location: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_label?: string | null
          href: string
          id?: string
          label: string
          location?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          group_label?: string | null
          href?: string
          id?: string
          label?: string
          location?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
        }
        Update: {
          body?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          line_total: number
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_total?: number
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_total?: number
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          cell: string | null
          city: string | null
          country: string | null
          created_at: string
          customer_name: string | null
          delivery_fee: number
          delivery_instructions: string | null
          district: string | null
          email: string | null
          id: string
          item_name: string | null
          notes: string | null
          order_type: string
          payment_method: string | null
          paypack_ref: string | null
          phone: string | null
          postal_code: string | null
          province: string | null
          sector: string | null
          service_slug: string | null
          session_id: string | null
          status: string
          street_address: string | null
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
          village: string | null
        }
        Insert: {
          amount: number
          cell?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_fee?: number
          delivery_instructions?: string | null
          district?: string | null
          email?: string | null
          id?: string
          item_name?: string | null
          notes?: string | null
          order_type?: string
          payment_method?: string | null
          paypack_ref?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          sector?: string | null
          service_slug?: string | null
          session_id?: string | null
          status?: string
          street_address?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Update: {
          amount?: number
          cell?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          customer_name?: string | null
          delivery_fee?: number
          delivery_instructions?: string | null
          district?: string | null
          email?: string | null
          id?: string
          item_name?: string | null
          notes?: string | null
          order_type?: string
          payment_method?: string | null
          paypack_ref?: string | null
          phone?: string | null
          postal_code?: string | null
          province?: string | null
          sector?: string | null
          service_slug?: string | null
          session_id?: string | null
          status?: string
          street_address?: string | null
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
          village?: string | null
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          active: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          active: boolean
          category_id: string | null
          compare_at_price: number | null
          created_at: string
          currency: string
          description: string | null
          featured: boolean
          id: string
          images: Json
          low_stock_threshold: number
          name: string
          price: number
          short_description: string | null
          slug: string
          sort_order: number
          stock: number
          trending: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: Json
          low_stock_threshold?: number
          name: string
          price?: number
          short_description?: string | null
          slug: string
          sort_order?: number
          stock?: number
          trending?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          compare_at_price?: number | null
          created_at?: string
          currency?: string
          description?: string | null
          featured?: boolean
          id?: string
          images?: Json
          low_stock_threshold?: number
          name?: string
          price?: number
          short_description?: string | null
          slug?: string
          sort_order?: number
          stock?: number
          trending?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string
          published: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          published?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          published?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      quote_requests: {
        Row: {
          budget: string | null
          created_at: string
          details: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          product_id: string | null
          service_slug: string | null
          status: string
          updated_at: string
        }
        Insert: {
          budget?: string | null
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          product_id?: string | null
          service_slug?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          budget?: string | null
          created_at?: string
          details?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          product_id?: string | null
          service_slug?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      service_photos: {
        Row: {
          created_at: string
          id: string
          public_url: string
          service_slug: string
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          public_url: string
          service_slug: string
          sort_order?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          public_url?: string
          service_slug?: string
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      service_prices: {
        Row: {
          active: boolean
          amount: number
          created_at: string
          label: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          amount: number
          created_at?: string
          label: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          amount?: number
          created_at?: string
          label?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      services: {
        Row: {
          availability: string
          created_at: string
          description: string | null
          hidden: boolean
          icon: string | null
          lead_time_max: number
          lead_time_min: number
          slug: string
          sort_order: number
          title: string | null
          updated_at: string
        }
        Insert: {
          availability?: string
          created_at?: string
          description?: string | null
          hidden?: boolean
          icon?: string | null
          lead_time_max?: number
          lead_time_min?: number
          slug: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Update: {
          availability?: string
          created_at?: string
          description?: string | null
          hidden?: boolean
          icon?: string | null
          lead_time_max?: number
          lead_time_min?: number
          slug?: string
          sort_order?: number
          title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          created_at?: string
          key: string
          updated_at?: string
          value?: Json
        }
        Update: {
          created_at?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      social_links: {
        Row: {
          active: boolean
          created_at: string
          icon: string | null
          id: string
          platform: string
          sort_order: number
          updated_at: string
          url: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          platform: string
          sort_order?: number
          updated_at?: string
          url: string
        }
        Update: {
          active?: boolean
          created_at?: string
          icon?: string | null
          id?: string
          platform?: string
          sort_order?: number
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      team_members: {
        Row: {
          active: boolean
          bio: string | null
          created_at: string
          id: string
          name: string
          photo_url: string | null
          role_title: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          name: string
          photo_url?: string | null
          role_title?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          bio?: string | null
          created_at?: string
          id?: string
          name?: string
          photo_url?: string | null
          role_title?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      testimonials: {
        Row: {
          body: string
          created_at: string
          email: string | null
          id: string
          image_url: string | null
          name: string
          rating: number
          role_label: string | null
          sort_order: number
          status: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          name: string
          rating?: number
          role_label?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          email?: string | null
          id?: string
          image_url?: string | null
          name?: string
          rating?: number
          role_label?: string | null
          sort_order?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "user"
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
    Enums: {
      app_role: ["admin", "user"],
    },
  },
} as const
