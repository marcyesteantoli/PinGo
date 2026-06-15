// Auto-generado con: npm run supabase:types
// No editar manualmente

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          avatar_url: string | null
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          name: string
          avatar_url?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          name?: string
          avatar_url?: string | null
          updated_at?: string
          deleted_at?: string | null
        }
      }
      trips: {
        Row: {
          id: string
          title: string
          start_date: string
          end_date: string
          currency: string
          created_by: string | null
          join_code: string
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          start_date: string
          end_date: string
          currency?: string
          created_by: string
          join_code?: string
          created_at?: string
        }
        Update: {
          title?: string
          start_date?: string
          end_date?: string
          currency?: string
        }
      }
      trip_collaborators: {
        Row: {
          trip_id: string
          user_id: string
          role: 'owner' | 'member'
          status: 'active' | 'left'
          joined_at: string
        }
        Insert: {
          trip_id: string
          user_id: string
          role?: 'owner' | 'member'
          status?: 'active' | 'left'
          joined_at?: string
        }
        Update: {
          role?: 'owner' | 'member'
          status?: 'active' | 'left'
          joined_at?: string
        }
      }
      experiences: {
        Row: {
          id: string
          trip_id: string | null
          type: 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'entertainment' | 'city' | 'other'
          title: string
          location: Json | null
          confirmation_code: string | null
          start_time: string | null
          end_time: string | null
          date: string | null
          destination_id: string | null
          created_by: string | null
          updated_at: string
        }
        Insert: {
          id?: string
          trip_id?: string | null
          type: 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'entertainment' | 'city' | 'other'
          title: string
          location?: Json | null
          confirmation_code?: string | null
          start_time?: string | null
          end_time?: string | null
          date?: string | null
          destination_id?: string | null
          created_by: string
          updated_at?: string
        }
        Update: {
          type?: 'transport' | 'accommodation' | 'activity' | 'restaurant' | 'entertainment' | 'city' | 'other'
          title?: string
          location?: Json | null
          confirmation_code?: string | null
          start_time?: string | null
          end_time?: string | null
          date?: string | null
          destination_id?: string | null
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          experience_id: string
          trip_id: string
          name: string
          file_path: string | null
          file_type: string | null
          document_type: 'file' | 'link' | 'pass'
          url: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          experience_id: string
          trip_id: string
          name: string
          file_path?: string | null
          file_type?: string | null
          document_type?: 'file' | 'link' | 'pass'
          url?: string | null
          uploaded_by: string
          created_at?: string
        }
        Update: {
          name?: string
        }
      }
      expenses: {
        Row: {
          id: string
          trip_id: string
          experience_id: string | null
          amount: number
          currency: string
          description: string
          payer_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          experience_id?: string | null
          amount: number
          currency?: string
          description: string
          payer_id: string
          created_at?: string
        }
        Update: {
          amount?: number
          description?: string
        }
      }
      expense_splits: {
        Row: {
          expense_id: string
          user_id: string
          amount: number
        }
        Insert: {
          expense_id: string
          user_id: string
          amount: number
        }
        Update: {
          amount?: number
        }
      }
      experience_ratings: {
        Row: {
          experience_id: string
          user_id: string
          rating: number
          created_at: string
        }
        Insert: {
          experience_id: string
          user_id: string
          rating: number
          created_at?: string
        }
        Update: {
          rating?: number
        }
      }
      memories: {
        Row: {
          id: string
          trip_id: string
          user_id: string | null
          image_url: string
          caption: string | null
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          user_id: string
          image_url: string
          caption?: string | null
          created_at?: string
        }
        Update: {
          caption?: string | null
        }
      }
      trip_destinations: {
        Row: {
          id: string
          trip_id: string
          name: string
          country: string | null
          lat: number | null
          lng: number | null
          start_date: string
          end_date: string
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          trip_id: string
          name: string
          country?: string | null
          lat?: number | null
          lng?: number | null
          start_date: string
          end_date: string
          sort_order?: number
          created_at?: string
        }
        Update: {
          name?: string
          country?: string | null
          lat?: number | null
          lng?: number | null
          start_date?: string
          end_date?: string
          sort_order?: number
        }
      }
    }
    Views: {
      experience_ratings_avg: {
        Row: {
          experience_id: string
          rating_avg: number
          rating_count: number
        }
      }
    }
    Functions: {
      create_standalone_saved_experience: {
        Args: {
          p_title: string
          p_type: string
          p_location?: Json | null
          p_note?: string | null
          p_price_paid?: number | null
        }
        Returns: string
      }
    }
  }
}
