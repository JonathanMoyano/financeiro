'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  TrendingDown, 
  TrendingUp, 
  PiggyBank,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  Target,
  Wallet,
  CreditCard,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { 
  supabase, 
  getCurrentUser, 
  getFinancialData, 
  getRecentTransactions, 
  addPoupanca,
  clearCorruptedAuth,
  testConnection
} from '@/lib/supabase'

interface FinanceData {
  receitas: number
  despesas: number
  poupanca: number
  metaMensal: number
}

interface RecentTransaction {
  id: string
  tipo: 'receita' | 'despesa' | 'poupanca'
  descricao: string
  valor: number
  data: string
  categoria: string
  created_at: string
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [financeData, setFinanceData] = useState<FinanceData>({
    receitas: 0,
    despesas: 0,
    poupanca: 0,
    metaMensal: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [showPoupancaModal, setShowPoupancaModal] = useState(false)
  const [poupancaForm, setPoupancaForm] = useState({
    valor: '',
    tipo: 'deposito' as 'deposito' | 'saque',
    descricao: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'error'>('connecting')

  const router = useRouter()

  // Verificar conexão inicial
  useEffect(() => {
    const checkConnection = async () => {
      const isConnected = await testConnection()
      setConnectionStatus(isConnected ? 'connected' : 'error')
    }
    checkConnection()
  }, [])

  // Verificar autenticação
  useEffect(() => {
    const checkAuth = async () => {
      try {
        console.log('🔍 Verificando autenticação...')
        
        const currentUser = await getCurrentUser()
        
        if (!currentUser) {
          console.log('❌ Usuário não autenticado, redirecionando...')
          router.push('/login')
          return
        }

        console.log('✅ Usuário autenticado:', currentUser.id)
        setUser(currentUser)
        setLoading(false)
        setError(null)
      } catch (error) {
        console.error('❌ Erro na verificação de autenticação:', error)
        setError('Erro de autenticação')
        router.push('/login')
      }
    }

    checkAuth()

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Mudança de autenticação:', event)
        
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        } else if (session?.user) {
          setUser(session.user)
          setLoading(false)
          setError(null)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [router])

  // Carregar dados quando usuário está disponível
  useEffect(() => {
    if (user && connectionStatus === 'connected') {
      loadAllData()
    }
  }, [user, connectionStatus])

  const loadAllData = async () => {
    if (!user) return

    try {
      setError(null)
      console.log('📊 Carregando todos os dados...')
      
      await Promise.all([
        loadFinanceData(),
        loadRecentTransactions()
      ])
      
      console.log('✅ Todos os dados carregados')
      setSuccess('Dados carregados com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setError('Erro ao carregar dados financeiros')
    }
  }

  const loadFinanceData = async () => {
    if (!user) return

    try {
      const data = await getFinancialData(user.id)
      setFinanceData(data)
    } catch (error) {
      console.error('❌ Erro ao carregar dados financeiros:', error)
      throw error
    }
  }

  const loadRecentTransactions = async () => {
    if (!user) return

    setTransactionsLoading(true)
    try {
      const transactions = await getRecentTransactions(user.id)
      setRecentTransactions(transactions)
    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error)
    } finally {
      setTransactionsLoading(false)
    }
  }

  const handlePoupancaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      await addPoupanca(user.id, {
        valor: parseFloat(poupancaForm.valor),
        tipo: poupancaForm.tipo,
        descricao: poupancaForm.descricao
      })

      // Recarregar dados
      await loadAllData()
      
      // Fechar modal e limpar form
      setShowPoupancaModal(false)
      setPoupancaForm({ valor: '', tipo: 'deposito', descricao: '' })
      
      setSuccess('Movimentação de poupança salva com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao salvar poupança:', error)
      setError('Erro ao salvar movimentação. Tente novamente.')
    }
  }

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ ••••••'
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  }

  const handleRefresh = async () => {
    if (user) {
      await loadAllData()
    }
  }

  const handleClearAuth = async () => {
    await clearCorruptedAuth()
    router.push('/login')
  }

  const saldo = financeData.receitas - financeData.despesas
  const progressoMeta = financeData.metaMensal > 0 ? (saldo / financeData.metaMensal) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando dashboard...</p>
          <p className="text-sm text-muted-foreground mt-2">Status: {connectionStatus}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Alertas de Status */}
      {connectionStatus === 'error' && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h4 className="text-red-800 font-medium">Problema de Conexão</h4>
              <p className="text-red-700 text-sm">Não foi possível conectar ao banco de dados.</p>
              <button 
                onClick={handleClearAuth}
                className="text-red-600 text-sm underline mt-1"
              >
                Limpar dados e fazer login novamente
              </button>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div>
              <h4 className="text-red-800 font-medium">Erro</h4>
              <p className="text-red-700 text-sm">{error}</p>
              <button 
                onClick={() => setError(null)}
                className="text-red-600 text-sm underline mt-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <h4 className="text-green-800 font-medium">Sucesso</h4>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">
            Olá, {user.user_metadata.full_name || user.email?.split('@')[0]}! Bem-vindo ao seu painel financeiro.
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>ID: {user.id.substring(0, 8)}...</span>
            <span className={`flex items-center gap-1 ${
              connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {connectionStatus}
            </span>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${saldo >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Wallet className={`h-6 w-6 ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Saldo Atual</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Receitas - Despesas do mês
          </div>
        </div>

        {/* Receitas */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Receitas</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(financeData.receitas)}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/despesas')}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors text-left"
          >
            Gerenciar receitas →
          </button>
        </div>

        {/* Despesas */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Despesas</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(financeData.despesas)}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/despesas')}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors text-left"
          >
            Gerenciar despesas →
          </button>
        </div>

        {/* Poupança */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Poupança</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(financeData.poupanca)}
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPoupancaModal(true)}
            className="w-full inline-flex items-center text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <Plus className="h-4 w-4 mr-1" />
            Nova movimentação
          </button>
        </div>
      </div>

      {/* Progresso da meta mensal */}
      {financeData.metaMensal > 0 && (
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-lg font-semibold">Meta Mensal</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressoMeta)}% da meta
            </span>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  progressoMeta >= 100 ? 'bg-emerald-500' : progressoMeta >= 50 ? 'bg-primary' : 'bg-yellow-500'
                }`}
                style={{ width: `${Math.min(progressoMeta, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Atual: {formatCurrency(saldo)}</span>
              <span className="text-muted-foreground">Meta: {formatCurrency(financeData.metaMensal)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/despesas')}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Plus className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Nova Receita</h3>
              <p className="text-sm text-muted-foreground">Registre uma nova entrada</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/despesas')}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-red-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <CreditCard className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Nova Despesa</h3>
              <p className="text-sm text-muted-foreground">Registre um novo gasto</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => setShowPoupancaModal(true)}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Poupança</h3>
              <p className="text-sm text-muted-foreground">Movimente sua poupança</p>
            </div>
          </div>
        </button>
      </div>

      {/* Transações recentes */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Transações Recentes</h3>
            <button
              onClick={loadRecentTransactions}
              className="text-sm text-primary hover:text-primary/80 transition-colors"
            >
              Atualizar
            </button>
          </div>
        </div>
        <div className="p-6">
          {transactionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-3 text-muted-foreground">Carregando transações...</span>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${
                      transaction.tipo === 'receita' ? 'bg-emerald-500/10' :
                      transaction.tipo === 'despesa' ? 'bg-red-500/10' : 'bg-blue-500/10'
                    }`}>
                      {transaction.tipo === 'receita' ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : transaction.tipo === 'despesa' ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <PiggyBank className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">{transaction.descricao}</p>
                      <p className="text-sm text-muted-foreground">
                        {transaction.categoria} • {new Date(transaction.data).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <span className={`font-semibold ${
                    transaction.tipo === 'receita' || (transaction.tipo === 'poupanca' && transaction.categoria === 'deposito')
                      ? 'text-emerald-500' 
                      : 'text-red-500'
                  }`}>
                    {transaction.tipo === 'poupanca' && transaction.categoria === 'saque' ? '-' : '+'}
                    {formatCurrency(transaction.valor)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground/70">
                Comece adicionando suas primeiras transações!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal Poupança */}
      {showPoupancaModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-card">
            <div className="mt-3">
              <h3 className="text-lg font-medium mb-4">
                Movimentação da Poupança
              </h3>
              
              <form onSubmit={handlePoupancaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de Movimentação
                  </label>
                  <select
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={poupancaForm.tipo}
                    onChange={(e) => setPoupancaForm({...poupancaForm, tipo: e.target.value as 'deposito' | 'saque'})}
                  >
                    <option value="deposito">Depósito</option>
                    <option value="saque">Saque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={poupancaForm.valor}
                    onChange={(e) => setPoupancaForm({...poupancaForm, valor: e.target.value})}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={poupancaForm.descricao}
                    onChange={(e) => setPoupancaForm({...poupancaForm, descricao: e.target.value})}
                    placeholder="Ex: Reserva de emergência"
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowPoupancaModal(false)}
                    className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}