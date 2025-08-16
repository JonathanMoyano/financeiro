// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variáveis de ambiente do Supabase não configuradas')
}

// Função para criar cliente (compatibilidade com Next.js SSR)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Cliente único para uso direto
export const supabase = createClient()

export default supabase