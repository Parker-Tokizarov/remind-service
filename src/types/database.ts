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
      profiles: {
        Row: {
          id: string
          full_name: string | null
          phone: string | null
          telegram_token: string | null
          telegram_chat_id: string | null
          created_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          phone?: string | null
          telegram_token?: string | null
          telegram_chat_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string | null
          phone?: string | null
          telegram_token?: string | null
          telegram_chat_id?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string
          address: string | null
          equipment_type: string
          last_visit_date: string
          next_maintenance_date: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          phone: string
          address?: string | null
          equipment_type: string
          last_visit_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string
          address?: string | null
          equipment_type?: string
          last_visit_date?: string
          next_maintenance_date?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          client_id: string
          date: string
          description: string
          amount: number
          visit_date: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          date: string
          description: string
          amount?: number
          visit_date?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          date?: string
          description?: string
          amount?: number
          visit_date?: string | null
          created_at?: string
        }
      }
      templates: {
        Row: {
          id: string
          user_id: string
          name: string
          type: 'visit' | 'maintenance'
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          type: 'visit' | 'maintenance'
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          type?: 'visit' | 'maintenance'
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
