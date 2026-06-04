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
      documents: {
        Row: {
          created_at: string | null
          experience_id: string
          file_type: string | null
          file_url: string
          id: string
          name: string
          trip_id: string
          uploaded_by: string
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          file_type?: string | null
          file_url: string
          id?: string
          name: string
          trip_id: string
          uploaded_by: string
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          file_type?: string | null
          file_url?: string
          id?: string
          name?: string
          trip_id?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_splits: {
        Row: {
          amount: number
          expense_id: string
          user_id: string
        }
        Insert: {
          amount: number
          expense_id: string
          user_id: string
        }
        Update: {
          amount?: number
          expense_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_splits_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_splits_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string
          experience_id: string | null
          id: string
          payer_id: string
          trip_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string
          description: string
          experience_id?: string | null
          id?: string
          payer_id: string
          trip_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string
          experience_id?: string | null
          id?: string
          payer_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_payer_id_fkey"
            columns: ["payer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_attribute_ratings: {
        Row: {
          attribute: string
          created_at: string | null
          experience_id: string
          user_id: string
          value: number
        }
        Insert: {
          attribute: string
          created_at?: string | null
          experience_id: string
          user_id: string
          value: number
        }
        Update: {
          attribute?: string
          created_at?: string | null
          experience_id?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "experience_attribute_ratings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_attribute_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_ratings: {
        Row: {
          created_at: string | null
          experience_id: string
          rating: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_id: string
          rating: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_ratings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experience_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          confirmation_code: string | null
          created_by: string
          date: string | null
          end_time: string | null
          id: string
          location: Json | null
          start_time: string | null
          title: string
          trip_id: string
          type: string
          updated_at: string | null
        }
        Insert: {
          confirmation_code?: string | null
          created_by: string
          date?: string | null
          end_time?: string | null
          id?: string
          location?: Json | null
          start_time?: string | null
          title: string
          trip_id: string
          type: string
          updated_at?: string | null
        }
        Update: {
          confirmation_code?: string | null
          created_by?: string
          date?: string | null
          end_time?: string | null
          id?: string
          location?: Json | null
          start_time?: string | null
          title?: string
          trip_id?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "experiences_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "experiences_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      memories: {
        Row: {
          caption: string | null
          created_at: string | null
          id: string
          image_url: string
          trip_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url: string
          trip_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string | null
          id?: string
          image_url?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memories_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "memories_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          id: string
          is_premium: boolean
          name: string
          plan: string
          plan_expires_at: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          id: string
          is_premium?: boolean
          name: string
          plan?: string
          plan_expires_at?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          id?: string
          is_premium?: boolean
          name?: string
          plan?: string
          plan_expires_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      trip_unlocks: {
        Row: {
          id: string
          trip_id: string
          user_id: string
          purchased_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          purchased_at?: string
        }
        Update: {
          id?: string
          trip_id?: string
          user_id?: string
          purchased_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_unlocks_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_unlocks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_collaborators: {
        Row: {
          role: string
          trip_id: string
          user_id: string
        }
        Insert: {
          role?: string
          trip_id: string
          user_id: string
        }
        Update: {
          role?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_collaborators_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_collaborators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_destinations: {
        Row: {
          country: string | null
          created_at: string | null
          end_date: string
          id: string
          lat: number | null
          lng: number | null
          name: string
          sort_order: number | null
          start_date: string
          trip_id: string
        }
        Insert: {
          country?: string | null
          created_at?: string | null
          end_date: string
          id?: string
          lat?: number | null
          lng?: number | null
          name: string
          sort_order?: number | null
          start_date: string
          trip_id: string
        }
        Update: {
          country?: string | null
          created_at?: string | null
          end_date?: string
          id?: string
          lat?: number | null
          lng?: number | null
          name?: string
          sort_order?: number | null
          start_date?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_destinations_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trip_settlements: {
        Row: {
          amount: number
          created_at: string
          from_user_id: string
          id: string
          settled_by: string | null
          to_user_id: string
          trip_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_user_id: string
          id?: string
          settled_by?: string | null
          to_user_id: string
          trip_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_user_id?: string
          id?: string
          settled_by?: string | null
          to_user_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_settlements_from_user_id_fkey"
            columns: ["from_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_settled_by_fkey"
            columns: ["settled_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_to_user_id_fkey"
            columns: ["to_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trip_settlements_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          created_at: string | null
          created_by: string
          currency: string
          end_date: string
          id: string
          join_code: string
          start_date: string
          title: string
        }
        Insert: {
          created_at?: string | null
          created_by: string
          currency?: string
          end_date: string
          id?: string
          join_code?: string
          start_date: string
          title: string
        }
        Update: {
          created_at?: string | null
          created_by?: string
          currency?: string
          end_date?: string
          id?: string
          join_code?: string
          start_date?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_saved_experiences: {
        Row: {
          experience_id: string
          note: string | null
          saved_at: string
          user_id: string
        }
        Insert: {
          experience_id: string
          note?: string | null
          saved_at?: string
          user_id: string
        }
        Update: {
          experience_id?: string
          note?: string | null
          saved_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_saved_experiences_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_saved_experiences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlist_items: {
        Row: {
          added_at: string
          id: string
          location: Json | null
          name: string
          note: string | null
          type: string
          user_id: string
          visited_at: string | null
        }
        Insert: {
          added_at?: string
          id?: string
          location?: Json | null
          name: string
          note?: string | null
          type: string
          user_id: string
          visited_at?: string | null
        }
        Update: {
          added_at?: string
          id?: string
          location?: Json | null
          name?: string
          note?: string | null
          type?: string
          user_id?: string
          visited_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      experience_attribute_ratings_avg: {
        Row: {
          attribute: string | null
          avg: number | null
          experience_id: string | null
          rating_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_attribute_ratings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experience_ratings_avg: {
        Row: {
          experience_id: string | null
          rating_avg: number | null
          rating_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "experience_ratings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_expense_with_splits:
        | {
            Args: {
              p_amount: number
              p_description: string
              p_experience_id: string
              p_participant_ids: string[]
              p_payer_id: string
              p_trip_id: string
            }
            Returns: string
          }
        | {
            Args: {
              p_amount: number
              p_currency?: string
              p_description: string
              p_experience_id: string
              p_participant_ids: string[]
              p_payer_id: string
              p_trip_id: string
            }
            Returns: string
          }
      create_trip:
        | {
            Args: { p_end_date: string; p_start_date: string; p_title: string }
            Returns: Json
          }
        | {
            Args: {
              p_currency?: string
              p_end_date: string
              p_start_date: string
              p_title: string
            }
            Returns: {
              created_at: string | null
              created_by: string
              currency: string
              end_date: string
              id: string
              join_code: string
              start_date: string
              title: string
            }[]
            SetofOptions: {
              from: "*"
              to: "trips"
              isOneToOne: false
              isSetofReturn: true
            }
          }
      delete_expense_safe: {
        Args: { p_also_clear_settlements?: boolean; p_expense_id: string }
        Returns: undefined
      }
      is_trip_member: { Args: { check_trip_id: string }; Returns: boolean }
      join_trip_by_code: { Args: { p_join_code: string }; Returns: string }
      settle_debt_safe: {
        Args: {
          p_amount: number
          p_from_user_id: string
          p_settled_by: string
          p_to_user_id: string
          p_trip_id: string
        }
        Returns: undefined
      }
      test_auth_context: { Args: never; Returns: Json }
      update_expense_with_splits: {
        Args: {
          p_amount: number
          p_description: string
          p_expense_id: string
          p_experience_id: string
          p_participant_ids: string[]
          p_payer_id: string
        }
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
