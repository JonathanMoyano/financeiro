'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
  CheckCircle,
  Loader2,
  BarChart3,
  ArrowRight,
  DollarSign,
  Users,
  Activity,
  Clock,
  Filter,
  Download,
  Settings,
  Bell,
  X
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface FinanceData {
  receitas: number
  despesas: number
  poupanca: number
  metaMensal: number
  totalMetas: number
  metasAtingidas: number
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

interface MonthlyData {
  mes: string
  receitas: number
  despesas: number
  saldo: number
}

interface CategoryData {
  categoria: string
  valor: number
  percentual: number
  cor: string
}

interface Notification {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error'
  created_at: string
  read: boolean
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [transactionsLoading, setTransactionsLoading] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [financeData, setFinanceData] = useState<FinanceData>({
    receitas: 0,
    despesas: 0,
    poupanca: 0,
    metaMensal: 0,
    totalMetas: 0,
    metasAtingidas: 0
  })
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([])
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [showPoupancaModal, setShowPoupancaModal] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [poupancaForm, setPoupancaForm] = useState({
    valor: '',
    tipo: 'deposito' as 'deposito' | 'saque',
    descricao: ''
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loadingStates, setLoadingStates] = useState({
    finance: false,
    transactions: false,
    monthly: false,
    categories: false
  })

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Cores para categorias
  const categoryColors = [
    '#10b981', // emerald
    '#3b82f6', // blue
    '#f59e0b', // amber
    '#ef4444', // red
    '#8b5cf6', // violet
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#f97316'  // orange
  ]

  // Verificar se está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar autenticação
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      console.log('❌ Usuário não autenticado, redirecionando...')
      router.push('/login')
    }
  }, [user, authLoading, router, mounted])

  // Carregar dados quando usuário está disponível
  useEffect(() => {
    if (mounted && user && !authLoading) {
      loadAllData()
      loadNotifications()
    }
  }, [user, authLoading, mounted, selectedPeriod])

  const loadAllData = async () => {
    if (!user) return

    try {
      setError(null)
      console.log('📊 Carregando todos os dados...')
      
      await Promise.all([
        loadFinanceData(),
        loadRecentTransactions(),
        loadMonthlyData(),
        loadCategoryData()
      ])
      
      console.log('✅ Todos os dados carregados')
      setSuccess('Dados carregados com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error)
      setError('Erro ao carregar dados financeiros')
    }
  }

  const getDateRange = () => {
    const now = new Date()
    let startDate: Date
    let endDate: Date

    switch (selectedPeriod) {
      case 'current_month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'last_month':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        endDate = new Date(now.getFullYear(), now.getMonth(), 0)
        break
      case 'last_3_months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
        break
      case 'current_year':
        startDate = new Date(now.getFullYear(), 0, 1)
        endDate = new Date(now.getFullYear(), 11, 31)
        break
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    }
  }

const loadFinanceData = async () => {
  if (!user) return

  setLoadingStates(prev => ({ ...prev, finance: true }))
  try {
    console.log('💰 Carregando dados financeiros...')
    
    const { start, end } = getDateRange()
    console.log('📅 Período:', start, 'até', end)

    // Despesas do período
    let despesas = 0
    try {
      const { data: despesasData, error: despesasError } = await supabase
        .from('despesas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', start)
        .lte('data', end)

      if (despesasError) {
        console.error('Erro ao buscar despesas:', despesasError)
      } else {
        despesas = despesasData?.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 0
      }
    } catch (error) {
      console.error('Erro ao processar despesas:', error)
      despesas = 0
    }

    // Receitas do período
    let receitas = 0
    try {
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas')
        .select('valor')
        .eq('user_id', user.id)
        .gte('data', start)
        .lte('data', end)

      if (receitasError) {
        console.error('Erro ao buscar receitas:', receitasError)
      } else {
        receitas = receitasData?.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 0
      }
    } catch (error) {
      console.error('Erro ao processar receitas:', error)
      receitas = 0
    }

    // Poupança total - CORRIGIDO
    let poupanca = 0
    let totalMetas = 0
    let metasAtingidas = 0
    try {
      const { data: poupancaData, error: poupancaError } = await supabase
        .from('poupanca')
        .select('valor_atual, valor_objetivo')
        .eq('user_id', user.id)

      if (poupancaError) {
        console.error('Erro ao buscar poupanças:', poupancaError)
        console.log('🔍 Verificando estrutura da tabela poupanca...')
        
        // Tentar buscar sem filtros para ver a estrutura
        const { data: testData, error: testError } = await supabase
          .from('poupanca')
          .select('*')
          .eq('user_id', user.id)
          .limit(1)
        
        if (testError) {
          console.error('Erro no teste da tabela poupanca:', testError)
        } else {
          console.log('📋 Estrutura encontrada na tabela poupanca:', testData)
          
          // Se a estrutura for diferente, tentar com os campos corretos
          if (testData && testData.length > 0) {
            const firstRecord = testData[0]
            console.log('🔍 Campos disponíveis:', Object.keys(firstRecord))
            
            // Tentar buscar todos os registros
            const { data: allPoupanca, error: allError } = await supabase
              .from('poupanca')
              .select('*')
              .eq('user_id', user.id)
            
            if (!allError && allPoupanca) {
              poupanca = allPoupanca.reduce((sum, item) => {
                // Tentar diferentes campos possíveis
                const valorAtual = item.valor_atual || item.valor || 0
                return sum + (Number(valorAtual) || 0)
              }, 0)
              
              totalMetas = allPoupanca.length
              
              metasAtingidas = allPoupanca.filter(item => {
                const valorAtual = Number(item.valor_atual || item.valor || 0)
                const valorObjetivo = Number(item.valor_objetivo || item.objetivo || item.meta || 0)
                return valorAtual >= valorObjetivo
              }).length
            }
          }
        }
      } else if (poupancaData && poupancaData.length > 0) {
        console.log('✅ Dados de poupança encontrados:', poupancaData.length, 'registros')
        
        poupanca = poupancaData.reduce((sum, item) => {
          const valorAtual = Number(item.valor_atual || 0)
          return sum + valorAtual
        }, 0)
        
        totalMetas = poupancaData.length
        
        metasAtingidas = poupancaData.filter(item => {
          const valorAtual = Number(item.valor_atual || 0)
          const valorObjetivo = Number(item.valor_objetivo || 0)
          return valorAtual >= valorObjetivo
        }).length
      }
    } catch (error) {
      console.error('Erro ao processar poupança:', error)
      poupanca = 0
      totalMetas = 0
      metasAtingidas = 0
    }

    // Atualizar estado
    setFinanceData({
      receitas: Number(receitas) || 0,
      despesas: Number(despesas) || 0,
      poupanca: Number(poupanca) || 0,
      metaMensal: 3000, // Valor fixo ou buscar de configurações
      totalMetas,
      metasAtingidas
    })

    console.log('✅ Dados financeiros carregados:', { 
      receitas, 
      despesas, 
      poupanca, 
      totalMetas, 
      metasAtingidas 
    })

  } catch (error) {
    console.error('❌ Erro geral ao carregar dados financeiros:', error)
    setFinanceData({
      receitas: 0,
      despesas: 0,
      poupanca: 0,
      metaMensal: 0,
      totalMetas: 0,
      metasAtingidas: 0
    })
  } finally {
    setLoadingStates(prev => ({ ...prev, finance: false }))
  }
}

  const loadRecentTransactions = async () => {
    if (!user) return

    setLoadingStates(prev => ({ ...prev, transactions: true }))
    try {
      console.log('📋 Carregando transações recentes...')
      
      const transactions: RecentTransaction[] = []
      
      // Buscar despesas recentes
      try {
        const { data: despesasData, error: despesasError } = await supabase
          .from('despesas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(8)

        if (!despesasError && despesasData) {
          despesasData.forEach(despesa => {
            if (despesa && despesa.id) {
              transactions.push({
                id: despesa.id,
                tipo: 'despesa',
                descricao: despesa.descricao || 'Sem descrição',
                valor: Number(despesa.valor) || 0,
                data: despesa.data || new Date().toISOString().split('T')[0],
                categoria: despesa.categoria || 'Sem categoria',
                created_at: despesa.created_at || new Date().toISOString()
              })
            }
          })
        }
      } catch (error) {
        console.error('Erro ao buscar despesas:', error)
      }

      // Buscar poupanças recentes
      try {
        const { data: poupancaData, error: poupancaError } = await supabase
          .from('poupanca')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5)

        if (!poupancaError && poupancaData) {
          poupancaData.forEach(poupanca => {
            if (poupanca && poupanca.id) {
              transactions.push({
                id: poupanca.id,
                tipo: 'poupanca',
                descricao: poupanca.descricao || 'Sem descrição',
                valor: Number(poupanca.valor_atual) || 0,
                data: poupanca.data_objetivo || new Date().toISOString().split('T')[0],
                categoria: poupanca.categoria || 'Poupança',
                created_at: poupanca.created_at || new Date().toISOString()
              })
            }
          })
        }
      } catch (error) {
        console.error('Erro ao buscar poupanças:', error)
      }

      // Ordenar por data e limitar
      transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      setRecentTransactions(transactions.slice(0, 10))
      
      console.log('✅ Transações carregadas:', transactions.length)

    } catch (error) {
      console.error('❌ Erro ao carregar transações:', error)
      setRecentTransactions([])
    } finally {
      setLoadingStates(prev => ({ ...prev, transactions: false }))
    }
  }

  const loadMonthlyData = async () => {
    if (!user) return

    setLoadingStates(prev => ({ ...prev, monthly: true }))
    try {
      console.log('📊 Carregando dados mensais...')
      
      const monthlyResults: MonthlyData[] = []
      const now = new Date()
      
      // Últimos 6 meses
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0]
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0]
        
        let despesasMes = 0
        try {
          const { data } = await supabase
            .from('despesas')
            .select('valor')
            .eq('user_id', user.id)
            .gte('data', startOfMonth)
            .lte('data', endOfMonth)
          
          despesasMes = data?.reduce((sum, item) => sum + (Number(item.valor) || 0), 0) || 0
        } catch (error) {
          console.error(`Erro ao buscar despesas do mês ${date.getMonth() + 1}:`, error)
        }
        
        const receitasMes = 2500 // Mock - substituir por dados reais
        
        monthlyResults.push({
          mes: date.toLocaleDateString('pt-BR', { month: 'short' }),
          receitas: receitasMes,
          despesas: despesasMes,
          saldo: receitasMes - despesasMes
        })
      }
      
      setMonthlyData(monthlyResults)
      console.log('✅ Dados mensais carregados:', monthlyResults.length, 'meses')

    } catch (error) {
      console.error('❌ Erro ao carregar dados mensais:', error)
      setMonthlyData([])
    } finally {
      setLoadingStates(prev => ({ ...prev, monthly: false }))
    }
  }

  const loadCategoryData = async () => {
    if (!user) return

    setLoadingStates(prev => ({ ...prev, categories: true }))
    try {
      console.log('🏷️ Carregando dados por categoria...')
      
      const { start, end } = getDateRange()
      
      const { data: despesasData, error } = await supabase
        .from('despesas')
        .select('categoria, valor')
        .eq('user_id', user.id)
        .gte('data', start)
        .lte('data', end)

      if (error) {
        console.error('Erro ao buscar dados por categoria:', error)
        setCategoryData([])
        return
      }

      // Agrupar por categoria
      const categoryTotals: { [key: string]: number } = {}
      let totalGeral = 0

      despesasData?.forEach(item => {
        const categoria = item.categoria || 'Outros'
        const valor = Number(item.valor) || 0
        categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor
        totalGeral += valor
      })

      // Converter para array e calcular percentuais
      const categoryArray = Object.entries(categoryTotals)
        .map(([categoria, valor], index) => ({
          categoria,
          valor,
          percentual: totalGeral > 0 ? (valor / totalGeral) * 100 : 0,
          cor: categoryColors[index % categoryColors.length]
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8) // Top 8 categorias

      setCategoryData(categoryArray)
      console.log('✅ Dados por categoria carregados:', categoryArray.length, 'categorias')

    } catch (error) {
      console.error('❌ Erro ao carregar dados por categoria:', error)
      setCategoryData([])
    } finally {
      setLoadingStates(prev => ({ ...prev, categories: false }))
    }
  }

  const loadNotifications = async () => {
    if (!user) return

    try {
      // Gerar notificações baseadas nos dados
      const mockNotifications: Notification[] = [
        {
          id: '1',
          title: 'Meta atingida!',
          message: 'Parabéns! Você atingiu sua meta de poupança.',
          type: 'success',
          created_at: new Date().toISOString(),
          read: false
        },
        {
          id: '2',
          title: 'Despesas elevadas',
          message: 'Suas despesas este mês estão 15% acima da média.',
          type: 'warning',
          created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          read: false
        },
        {
          id: '3',
          title: 'Relatório mensal disponível',
          message: 'Seu relatório financeiro de outubro está pronto.',
          type: 'info',
          created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          read: true
        }
      ]

      setNotifications(mockNotifications)
    } catch (error) {
      console.error('Erro ao carregar notificações:', error)
    }
  }

  const handlePoupancaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      console.log('💾 Salvando movimentação de poupança...')
      
      const valor = parseFloat(poupancaForm.valor)
      
      if (isNaN(valor) || valor <= 0) {
        setError('Por favor, insira um valor válido.')
        return
      }
      
      const { error } = await supabase
        .from('poupanca')
        .insert({
          user_id: user.id,
          descricao: poupancaForm.descricao,
          valor_objetivo: valor,
          valor_atual: poupancaForm.tipo === 'deposito' ? valor : 0,
          data_objetivo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          categoria: 'Movimentação'
        })

      if (error) throw error

      await loadAllData()
      
      setShowPoupancaModal(false)
      setPoupancaForm({ valor: '', tipo: 'deposito', descricao: '' })
      
      setSuccess('Movimentação de poupança salva com sucesso!')
      setTimeout(() => setSuccess(null), 3000)
    } catch (error: any) {
      console.error('❌ Erro ao salvar poupança:', error)
      setError('Erro ao salvar movimentação. Tente novamente.')
    }
  }

  const formatCurrency = (value: number | undefined | null) => {
    if (!showValues) return 'R$ ••••••'
    
    if (value === undefined || value === null || isNaN(value)) {
      return 'R$ 0,00'
    }
    
    const numericValue = Number(value) || 0
    return `R$ ${numericValue.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const handleRefresh = async () => {
    if (user) {
      await loadAllData()
    }
  }

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push('/login')
    } catch (error) {
      console.error('❌ Erro ao fazer logout:', error)
    }
  }

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    )
  }

  const unreadNotifications = notifications.filter(n => !n.read).length

  // Cálculos seguros
  const saldo = (financeData?.receitas || 0) - (financeData?.despesas || 0)
  const progressoMeta = (financeData?.metaMensal || 0) > 0 ? (saldo / financeData.metaMensal) * 100 : 0
  const metasProgress = (financeData?.totalMetas || 0) > 0 ? 
    (financeData.metasAtingidas / financeData.totalMetas) * 100 : 0

  // Loading inicial
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  // Usuário não autenticado
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso negado</h3>
          <p className="text-gray-500 mb-4">Você precisa estar logado para acessar esta página.</p>
          <button
            onClick={() => router.push('/login')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
          >
            Ir para Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Alertas */}
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

      {/* Header com controles */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Financeiro</h1>
          <p className="text-muted-foreground">
            Olá, {user.user_metadata?.full_name || user.email?.split('@')[0]}! Bem-vindo ao seu painel.
          </p>
          <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
            <span>ID: {user.id.substring(0, 8)}...</span>
            <span className="flex items-center gap-1 text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              conectado
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Atualizado há poucos segundos
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Filtro de período */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="current_month">Mês atual</option>
              <option value="last_month">Mês passado</option>
              <option value="last_3_months">Últimos 3 meses</option>
              <option value="current_year">Ano atual</option>
            </select>
          </div>

          {/* Notificações */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors relative"
              title="Notificações"
            >
              <Bell className="h-5 w-5" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadNotifications}
                </span>
              )}
            </button>
            
            {/* Dropdown de notificações */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-card border rounded-xl shadow-lg z-50">
                <div className="p-4 border-b">
                  <h3 className="font-medium">Notificações</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map((notif) => (
                      <div
                        key={notif.id}
                        className={`p-3 border-b last:border-0 cursor-pointer hover:bg-accent/50 ${
                          !notif.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markNotificationAsRead(notif.id)}
                      >
                        <div className="flex items-start gap-3">
                          <div className={`p-1 rounded-full ${
                            notif.type === 'success' ? 'bg-green-100 text-green-600' :
                            notif.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                            notif.type === 'error' ? 'bg-red-100 text-red-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Activity className="h-3 w-3" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium">{notif.title}</p>
                            <p className="text-xs text-muted-foreground">{notif.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(notif.created_at).toLocaleTimeString('pt-BR')}
                            </p>
                          </div>
                          {!notif.read && (
                            <div className="w-2 h-2 bg-primary rounded-full" />
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma notificação</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
          
          <button
            onClick={handleSignOut}
            className="p-3 rounded-xl bg-red-50 hover:bg-red-100 border border-red-200 transition-colors text-red-600"
            title="Sair"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Cards principais de resumo */}
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
            Receitas - Despesas do período
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Receitas */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Receitas</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(financeData?.receitas)}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/despesas')}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors text-left flex items-center gap-1"
          >
            Gerenciar receitas <ArrowRight className="h-3 w-3" />
          </button>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Despesas</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(financeData?.despesas)}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/despesas')}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors text-left flex items-center gap-1"
          >
            Gerenciar despesas <ArrowRight className="h-3 w-3" />
          </button>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Poupança */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Poupança Total</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(financeData?.poupanca)}
              </p>
            </div>
          </div>
          <button
            onClick={() => router.push('/poupanca')}
            className="w-full text-sm text-primary hover:text-primary/80 font-medium transition-colors text-left flex items-center gap-1"
          >
            Gerenciar metas <ArrowRight className="h-3 w-3" />
          </button>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Cards de métricas avançadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Progresso da meta mensal */}
        {(financeData?.metaMensal || 0) > 0 && (
          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Meta Mensal</h3>
              </div>
              <span className="text-sm text-muted-foreground">
                {Math.round(progressoMeta)}%
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
                <span className="text-muted-foreground">Meta: {formatCurrency(financeData?.metaMensal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Progresso das metas de poupança */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PiggyBank className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">Metas Atingidas</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {financeData?.metasAtingidas || 0}/{financeData?.totalMetas || 0}
            </span>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className="h-3 rounded-full transition-all duration-300 bg-blue-500"
                style={{ width: `${Math.min(metasProgress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{formatPercentage(metasProgress)} concluídas</span>
              <button
                onClick={() => setShowPoupancaModal(true)}
                className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Nova meta
              </button>
            </div>
          </div>
        </div>

        {/* Variação mensal */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">Variação</h3>
            </div>
            <span className="text-sm text-emerald-600 font-medium">+12.5%</span>
          </div>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Em relação ao mês anterior</p>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-emerald-600 font-medium">
                Economia de {formatCurrency(312.50)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Grid principal com gráficos e dados */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Gráfico de evolução mensal */}
        <div className="lg:col-span-2 bg-card rounded-xl border">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Evolução Mensal</h3>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                  <span>Receitas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Despesas</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span>Saldo</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-6">
            {loadingStates.monthly ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Carregando dados mensais...</span>
              </div>
            ) : monthlyData.length > 0 ? (
              <div className="space-y-4">
                {/* Mini gráfico de barras simples */}
                <div className="flex items-end justify-between h-32 gap-2">
                  {monthlyData.map((data, index) => (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex flex-col items-center gap-1 w-full">
                        {/* Barra de receitas */}
                        <div 
                          className="w-full bg-emerald-500 rounded-t opacity-70"
                          style={{ height: `${Math.max((data.receitas / 3000) * 60, 4)}px` }}
                          title={`Receitas: ${formatCurrency(data.receitas)}`}
                        ></div>
                        {/* Barra de despesas */}
                        <div 
                          className="w-full bg-red-500 rounded-b opacity-70"
                          style={{ height: `${Math.max((data.despesas / 3000) * 60, 4)}px` }}
                          title={`Despesas: ${formatCurrency(data.despesas)}`}
                        ></div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {data.mes}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Resumo dos dados */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Média Receitas</p>
                    <p className="font-semibold text-emerald-600">
                      {formatCurrency(monthlyData.reduce((acc, data) => acc + data.receitas, 0) / monthlyData.length)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Média Despesas</p>
                    <p className="font-semibold text-red-600">
                      {formatCurrency(monthlyData.reduce((acc, data) => acc + data.despesas, 0) / monthlyData.length)}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Média Saldo</p>
                    <p className="font-semibold text-blue-600">
                      {formatCurrency(monthlyData.reduce((acc, data) => acc + data.saldo, 0) / monthlyData.length)}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Dados insuficientes para o gráfico</p>
                <p className="text-sm text-muted-foreground/70">
                  Adicione mais transações para ver a evolução
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Despesas por categoria */}
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Despesas por Categoria</h3>
          </div>
          <div className="p-6">
            {loadingStates.categories ? (
              <div className="flex items-center justify-center h-48">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : categoryData.length > 0 ? (
              <div className="space-y-4">
                {/* Gráfico de pizza simples */}
                <div className="relative w-32 h-32 mx-auto mb-4">
                  <svg className="w-32 h-32 transform -rotate-90">
                    {categoryData.map((category, index) => {
                      const totalPercentage = categoryData.slice(0, index).reduce((acc, cat) => acc + cat.percentual, 0)
                      const circumference = 2 * Math.PI * 50
                      const strokeDasharray = `${(category.percentual / 100) * circumference} ${circumference}`
                      const strokeDashoffset = -((totalPercentage / 100) * circumference)
                      
                      return (
                        <circle
                          key={index}
                          cx="64"
                          cy="64"
                          r="50"
                          fill="transparent"
                          stroke={category.cor}
                          strokeWidth="20"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300"
                        />
                      )
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-lg font-bold">{categoryData.length}</div>
                      <div className="text-xs text-muted-foreground">cats</div>
                    </div>
                  </div>
                </div>
                
                {/* Lista de categorias */}
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {categoryData.map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: category.cor }}
                        ></div>
                        <span className="text-sm font-medium">{category.categoria}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">{formatCurrency(category.valor)}</div>
                        <div className="text-xs text-muted-foreground">{formatPercentage(category.percentual)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma categoria encontrada</p>
                <p className="text-sm text-muted-foreground/70">
                  Adicione despesas para ver a distribuição
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
              <p className="text-sm text-muted-foreground">Registrar entrada</p>
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
              <p className="text-sm text-muted-foreground">Registrar gasto</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/poupanca')}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Poupança</h3>
              <p className="text-sm text-muted-foreground">Gerenciar metas</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/relatorios')}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-purple-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-1">Relatórios</h3>
              <p className="text-sm text-muted-foreground">Análises detalhadas</p>
            </div>
          </div>
        </button>
      </div>

      {/* Transações recentes */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Transações Recentes</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={loadRecentTransactions}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Atualizar
              </button>
              <button
                onClick={() => router.push('/despesas')}
                className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loadingStates.transactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando transações...</span>
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-3">
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
                  <div className="text-right">
                    <span className={`font-semibold ${
                      transaction.tipo === 'receita' || transaction.tipo === 'poupanca'
                        ? 'text-emerald-500' 
                        : 'text-red-500'
                    }`}>
                      {transaction.tipo === 'despesa' ? '-' : '+'}
                      {formatCurrency(transaction.valor)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Comece adicionando suas primeiras transações!
              </p>
              <button
                onClick={() => router.push('/despesas')}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Adicionar Transação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Poupança */}
      {showPoupancaModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium">Nova Meta de Poupança</h3>
              <button
                onClick={() => setShowPoupancaModal(false)}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <form onSubmit={handlePoupancaSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Tipo
                </label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={poupancaForm.tipo}
                  onChange={(e) => setPoupancaForm({...poupancaForm, tipo: e.target.value as 'deposito' | 'saque'})}
                >
                  <option value="deposito">Nova Meta</option>
                  <option value="saque">Contribuição</option>
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
      )}

      {/* Overlay para fechar notificações */}
      {showNotifications && (
        <div 
          className="fixed inset-0 z-40"
          onClick={() => setShowNotifications(false)}
        />
      )}
    </div>
  )
}