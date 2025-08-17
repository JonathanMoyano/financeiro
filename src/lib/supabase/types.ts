// src/lib/supabase/types.ts
export type Database = {
  public: {
    Tables: {
      despesas: {
        Row: {
          id: string
          user_id: string
          descricao: string
          valor: number
          data: string
          categoria: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          descricao: string
          valor: number
          data: string
          categoria: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          descricao?: string
          valor?: number
          data?: string
          categoria?: string
          created_at?: string
          updated_at?: string
        }
      }
      poupanca: {
        Row: {
          id: string
          user_id: string
          descricao: string
          valor_objetivo: number
          valor_atual: number
          data_objetivo: string
          categoria: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          descricao: string
          valor_objetivo: number
          valor_atual?: number
          data_objetivo: string
          categoria: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          descricao?: string
          valor_objetivo?: number
          valor_atual?: number
          data_objetivo?: string
          categoria?: string
          created_at?: string
          updated_at?: string
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