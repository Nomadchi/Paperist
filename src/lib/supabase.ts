import { createClient } from '@supabase/supabase-js'
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project-id.supabase.co'
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Client-side Supabase client
export const supabase = createBrowserClient(supabaseUrl, supabaseKey)

// Database types
export type Database = {
  public: {
    Tables: {
      collected_articles: {
        Row: {
          id: string
          user_id: string
          arxiv_id: string
          title: string
          authors: Json | null // 使用 Json 类型来表示 JSONB
          summary: string | null
          pdf_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          arxiv_id: string
          title: string
          authors?: Json | null
          summary?: string | null
          pdf_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          arxiv_id?: string
          title?: string
          authors?: Json | null
          summary?: string | null
          pdf_url?: string | null
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
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// 定义一个 Json 类型，因为 Supabase 的 JSONB 列会映射到 JavaScript 的 any 或 unknown
// 你可以根据需要更精确地定义 Json 类型，例如 Array<any> 或 { [key: string]: any }
type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// 创建 Supabase 客户端，并使用 Database 类型进行类型化
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Enums<T extends keyof Database['public']['Enums']> =
  Database['public']['Enums'][T]

// 导出类型化的 Supabase 客户端
export const typedSupabase = createBrowserClient<Database>(supabaseUrl, supabaseKey)
