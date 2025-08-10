// lib/supabase.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/lib/database.types' // Substitua pelo seu tipo de database

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas')
}

// Cliente otimizado
export const supabase: SupabaseClient<Database> = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce',
    },
    db: {
      schema: 'public',
    },
    global: {
      headers: {
        'cache-control': 'max-age=300, stale-while-revalidate=600',
      },
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  }
)

// Cache simples em memória para otimização
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>()

export function getCachedData<T>(key: string): T | null {
  const cached = cache.get(key)
  if (!cached) return null
  
  const isExpired = Date.now() - cached.timestamp > cached.ttl
  if (isExpired) {
    cache.delete(key)
    return null
  }
  
  return cached.data as T
}

export function setCachedData<T>(key: string, data: T, ttl: number = 300000): void {
  cache.set(key, {
    data,
    timestamp: Date.now(),
    ttl,
  })
}

// Função otimizada para buscar transações com cache
export async function getTransactions(userId: string, limit: number = 100) {
  const cacheKey = `transactions-${userId}-${limit}`
  
  // Verificar cache primeiro
  const cachedData = getCachedData(cacheKey)
  if (cachedData) {
    return cachedData
  }

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      id,
      amount,
      description,
      date,
      category,
      type,
      created_at
    `)
    .eq('user_id', userId)
    .order('date', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Erro ao buscar transações:', error)
    throw error
  }

  // Cachear resultado por 5 minutos
  setCachedData(cacheKey, data, 300000)
  return data
}

// Função otimizada para buscar resumo financeiro
export async function getFinancialSummary(userId: string) {
  const cacheKey = `summary-${userId}`
  
  const cachedData = getCachedData(cacheKey)
  if (cachedData) {
    return cachedData
  }

  const { data, error } = await supabase
    .from('transactions')
    .select(`
      amount,
      type,
      date
    `)
    .eq('user_id', userId)
    .gte('date', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  if (error) {
    console.error('Erro ao buscar resumo:', error)
    throw error
  }

  // Calcular resumo
  const summary = data.reduce(
    (acc, transaction) => {
      if (transaction.type === 'income') {
        acc.totalIncome += transaction.amount
      } else {
        acc.totalExpenses += transaction.amount
      }
      return acc
    },
    { totalIncome: 0, totalExpenses: 0 }
  )

  const result = {
    ...summary,
    balance: summary.totalIncome - summary.totalExpenses,
  }

  // Cachear por 10 minutos
  setCachedData(cacheKey, result, 600000)
  return result
}

// Função para invalidar cache quando dados mudarem
export function invalidateCache(patterns: string[] = []) {
  if (patterns.length === 0) {
    cache.clear()
    return
  }

  for (const [key] of cache) {
    for (const pattern of patterns) {
      if (key.includes(pattern)) {
        cache.delete(key)
      }
    }
  }
}

// Hook personalizado para React Query (se estiver usando)
export const queryKeys = {
  transactions: (userId: string) => ['transactions', userId] as const,
  summary: (userId: string) => ['summary', userId] as const,
  categories: () => ['categories'] as const,
}