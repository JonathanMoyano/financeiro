// lib/supabase.ts
import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('❌ Variáveis de ambiente do Supabase não configuradas')
}

// Cliente único usando SSR (compatível com middleware)
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

// Função para criar cliente (compatibilidade)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Função para obter usuário atual
export async function getCurrentUser() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('❌ Erro ao obter sessão:', error)
      return null
    }
    
    return session?.user || null
  } catch (error) {
    console.error('❌ Erro crítico na autenticação:', error)
    return null
  }
}

// Função para buscar dados financeiros do mês atual
export async function getFinancialData(userId: string) {
  if (!userId) throw new Error('User ID é obrigatório')

  console.log('🔍 Buscando dados para usuário:', userId)

  try {
    // Data do mês atual
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    
    const startStr = startOfMonth.toISOString().split('T')[0]
    const endStr = endOfMonth.toISOString().split('T')[0]

    console.log('📅 Período:', startStr, 'até', endStr)

    // Buscar receitas do mês
    const { data: receitasData, error: receitasError } = await supabase
      .from('receitas')
      .select('valor')
      .eq('user_id', userId)
      .gte('data', startStr)
      .lte('data', endStr)

    if (receitasError) {
      console.error('❌ Erro receitas:', receitasError)
      throw receitasError
    }

    console.log('✅ Receitas encontradas:', receitasData?.length || 0, receitasData)

    // Buscar despesas do mês
    const { data: despesasData, error: despesasError } = await supabase
      .from('despesas')
      .select('valor')
      .eq('user_id', userId)
      .gte('data', startStr)
      .lte('data', endStr)

    if (despesasError) {
      console.error('❌ Erro despesas:', despesasError)
      throw despesasError
    }

    console.log('✅ Despesas encontradas:', despesasData?.length || 0, despesasData)

    // Buscar poupança total
    const { data: poupancaData, error: poupancaError } = await supabase
      .from('poupanca')
      .select('valor, tipo')
      .eq('user_id', userId)

    if (poupancaError) {
      console.error('❌ Erro poupança:', poupancaError)
      throw poupancaError
    }

    console.log('✅ Poupança encontrada:', poupancaData?.length || 0, poupancaData)

    // Buscar meta mensal ativa
    const { data: metaData, error: metaError } = await supabase
      .from('metas')
      .select('valor')
      .eq('user_id', userId)
      .eq('tipo', 'mensal')
      .eq('ativa', true)
      .maybeSingle()

    if (metaError) {
      console.error('❌ Erro meta:', metaError)
      // Não vamos jogar erro aqui, meta é opcional
    }

    console.log('✅ Meta encontrada:', metaData ? `R$ ${metaData.valor}` : 'Nenhuma')

    // Calcular totais
    const receitas = receitasData?.reduce((sum, item) => sum + Number(item.valor), 0) || 0
    const despesas = despesasData?.reduce((sum, item) => sum + Number(item.valor), 0) || 0
    
    const poupanca = poupancaData?.reduce((sum, item) => {
      const valor = Number(item.valor)
      return item.tipo === 'deposito' ? sum + valor : sum - valor
    }, 0) || 0

    const metaMensal = metaData ? Number(metaData.valor) : 0

    const resultado = {
      receitas,
      despesas,
      poupanca,
      metaMensal
    }

    console.log('📊 Resultado final:', resultado)
    return resultado

  } catch (error) {
    console.error('❌ Erro crítico ao buscar dados:', error)
    throw error
  }
}

// Função para buscar transações recentes
export async function getRecentTransactions(userId: string, limit: number = 8) {
  if (!userId) return []

  try {
    console.log('🔍 Buscando transações recentes para:', userId)

    // Buscar receitas, despesas e poupança recentes
    const [receitasResult, despesasResult, poupancaResult] = await Promise.allSettled([
      supabase
        .from('receitas')
        .select('id, descricao, valor, data, categoria, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),
      
      supabase
        .from('despesas')
        .select('id, descricao, valor, data, categoria, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(3),
      
      supabase
        .from('poupanca')
        .select('id, descricao, valor, data, tipo, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(2)
    ])

    const transactions: any[] = []

    // Processar receitas
    if (receitasResult.status === 'fulfilled' && receitasResult.value.data) {
      receitasResult.value.data.forEach(item => {
        transactions.push({
          id: item.id,
          tipo: 'receita',
          descricao: item.descricao,
          valor: Number(item.valor),
          data: item.data,
          categoria: item.categoria,
          created_at: item.created_at
        })
      })
      console.log('✅ Receitas processadas:', receitasResult.value.data.length)
    }

    // Processar despesas
    if (despesasResult.status === 'fulfilled' && despesasResult.value.data) {
      despesasResult.value.data.forEach(item => {
        transactions.push({
          id: item.id,
          tipo: 'despesa',
          descricao: item.descricao,
          valor: Number(item.valor),
          data: item.data,
          categoria: item.categoria,
          created_at: item.created_at
        })
      })
      console.log('✅ Despesas processadas:', despesasResult.value.data.length)
    }

    // Processar poupança
    if (poupancaResult.status === 'fulfilled' && poupancaResult.value.data) {
      poupancaResult.value.data.forEach(item => {
        transactions.push({
          id: item.id,
          tipo: 'poupanca',
          descricao: item.descricao,
          valor: Number(item.valor),
          data: item.data,
          categoria: item.tipo,
          created_at: item.created_at
        })
      })
      console.log('✅ Poupança processada:', poupancaResult.value.data.length)
    }

    // Ordenar por data de criação e limitar
    transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    const result = transactions.slice(0, limit)
    
    console.log('✅ Total de transações encontradas:', result.length)
    return result

  } catch (error) {
    console.error('❌ Erro ao buscar transações:', error)
    return []
  }
}

// Função para adicionar poupança
export async function addPoupanca(userId: string, data: {
  valor: number
  tipo: 'deposito' | 'saque'
  descricao: string
}) {
  try {
    console.log('💰 Adicionando poupança:', data)

    const { error } = await supabase
      .from('poupanca')
      .insert([{
        user_id: userId,
        valor: data.valor,
        tipo: data.tipo,
        descricao: data.descricao,
        data: new Date().toISOString().split('T')[0]
      }])

    if (error) {
      console.error('❌ Erro ao inserir poupança:', error)
      throw error
    }
    
    console.log('✅ Poupança adicionada com sucesso')
    return true
  } catch (error) {
    console.error('❌ Erro ao adicionar poupança:', error)
    throw error
  }
}

// Função para limpar dados corrompidos
export async function clearCorruptedAuth() {
  try {
    console.log('🧹 Limpando dados de autenticação...')
    
    // Limpar storage
    if (typeof window !== 'undefined') {
      localStorage.clear()
      sessionStorage.clear()
    }
    
    // Fazer logout limpo
    await supabase.auth.signOut()
    
    console.log('✅ Dados de autenticação limpos')
    return true
  } catch (error) {
    console.error('❌ Erro ao limpar autenticação:', error)
    return false
  }
}

// Função para testar conexão
export async function testConnection() {
  try {
    console.log('🔗 Testando conexão com Supabase...')
    
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1)

    if (error) {
      console.error('❌ Erro de conexão:', error)
      return false
    }

    console.log('✅ Conexão com Supabase OK')
    return true
  } catch (error) {
    console.error('❌ Erro crítico de conexão:', error)
    return false
  }
}

export default supabase