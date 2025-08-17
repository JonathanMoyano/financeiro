'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Copy,
  X,
  TrendingUp,
  TrendingDown,
  Wallet,
  Tag,
  Star,
  RefreshCw,
  Receipt,
  Zap,
  Calendar,
  DollarSign,
  Loader2,
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff
} from 'lucide-react'

// ============================================
// INTERFACES E TIPOS
// ============================================

interface Transacao {
  id: string
  user_id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria_nome?: string
  metodo_pagamento_nome?: string
  data: string
  observacoes?: string
  recorrente: boolean
  favorito: boolean
  created_at: string
  updated_at: string
}

interface Categoria {
  id: string
  nome: string
  icone: string
  cor: string
  tipo: string
}

interface MetodoPagamento {
  id: string
  nome: string
  icone: string
}

interface FiltrosAvancados {
  categoria: string
  tipo: string
  metodosPagamento: string[]
  dataInicio: string
  dataFim: string
  valorMin: string
  valorMax: string
  recorrente: boolean | null
  favoritos: boolean
}

interface FormData {
  descricao: string
  valor: string
  tipo: 'receita' | 'despesa'
  categoria_nome: string
  metodo_pagamento_nome: string
  data: string
  observacoes: string
  recorrente: boolean
  favorito: boolean
}

interface Resumo {
  totalReceitas: number
  totalDespesas: number
  saldo: number
  quantidade: number
  categoriaComMaiorGasto: string | null
  valorMaiorGasto: number
}

interface LoadingStates {
  transacoes: boolean
  categorias: boolean
  metodos: boolean
  salvando: boolean
  excluindo: boolean
}

// ============================================
// DADOS ESTÁTICOS E CONFIGURAÇÕES
// ============================================

const TEMPLATES_RAPIDOS = [
  { descricao: 'Almoço', categoria: 'Alimentação', valor: '25.00', tipo: 'despesa' as const },
  { descricao: 'Combustível', categoria: 'Transporte', valor: '80.00', tipo: 'despesa' as const },
  { descricao: 'Supermercado', categoria: 'Alimentação', valor: '150.00', tipo: 'despesa' as const },
  { descricao: 'Salário', categoria: 'Salário', valor: '3000.00', tipo: 'receita' as const },
  { descricao: 'Freelance', categoria: 'Freelance', valor: '500.00', tipo: 'receita' as const }
]

const ITEMS_PER_PAGE = 15
const SORT_OPTIONS = ['data', 'valor', 'categoria_nome', 'descricao'] as const
type SortOption = typeof SORT_OPTIONS[number]

// ============================================
// UTILITÁRIOS
// ============================================

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleDateString('pt-BR')
}

const getCategoriaColor = (categoria: string): string => {
  const colors: Record<string, string> = {
    'Alimentação': '#10b981',
    'Transporte': '#3b82f6',
    'Moradia': '#f59e0b',
    'Saúde': '#ef4444',
    'Educação': '#8b5cf6',
    'Lazer': '#06b6d4',
    'Roupas': '#84cc16',
    'Serviços': '#f97316',
    'Investimentos': '#14b8a6',
    'Salário': '#22c55e',
    'Freelance': '#a855f7',
    'Vendas': '#f97316'
  }
  return colors[categoria] || '#6b7280'
}

const getCategoriaIcon = (categoria: string): string => {
  const icons: Record<string, string> = {
    'Alimentação': '🍽️',
    'Transporte': '🚗',
    'Moradia': '🏠',
    'Saúde': '⚕️',
    'Educação': '📚',
    'Lazer': '🎮',
    'Roupas': '👕',
    'Serviços': '🔧',
    'Investimentos': '📈',
    'Salário': '💼',
    'Freelance': '💻',
    'Vendas': '🛒'
  }
  return icons[categoria] || '📦'
}// ============================================
// COMPONENTE PRINCIPAL
// ============================================

export default function DespesasPage() {
  // Estados principais
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  
  // Estados de dados
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [metodosPagamento, setMetodosPagamento] = useState<MetodoPagamento[]>([])
  
  // Estados de UI
  const [transacoesSelecionadas, setTransacoesSelecionadas] = useState<string[]>([])
  const [showModal, setShowModal] = useState(false)
  const [showFiltrosAvancados, setShowFiltrosAvancados] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [editandoTransacao, setEditandoTransacao] = useState<Transacao | null>(null)
  const [modoVisualizacao, setModoVisualizacao] = useState<'lista' | 'cards'>('lista')
  
  // Estados de paginação e filtros
  const [currentPage, setCurrentPage] = useState(1)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('data')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  // Estados de filtros avançados
  const [filtros, setFiltros] = useState<FiltrosAvancados>({
    categoria: '',
    tipo: '',
    metodosPagamento: [],
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    recorrente: null,
    favoritos: false
  })
  
  // Estados do formulário
  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    categoria_nome: '',
    metodo_pagamento_nome: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
    recorrente: false,
    favorito: false
  })
  
  // Estados de loading e erro
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    transacoes: true,
    categorias: true,
    metodos: true,
    salvando: false,
    excluindo: false
  })
  
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Hooks
  const router = useRouter()
  const supabase = createClient()
  
  // ============================================
  // EFEITOS E INICIALIZAÇÃO
  // ============================================
  
  // Verificar se está montado no cliente
  useEffect(() => {
    setMounted(true)
  }, [])
  
  // Verificar autenticação
  useEffect(() => {
    if (!mounted) return
    
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Erro ao verificar sessão:', error)
          router.push('/login')
          return
        }

        if (!session?.user) {
          router.push('/login')
          return
        }

        setUser(session.user)
      } catch (error) {
        console.error('Erro inesperado:', error)
        router.push('/login')
      }
    }

    checkAuth()

    // Listener para mudanças na autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        } else if (session?.user) {
          setUser(session.user)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [mounted, supabase, router])
  
  // Carregar dados quando usuário está disponível
  useEffect(() => {
    if (user) {
      Promise.all([
        loadTransacoes(),
        loadCategorias(),
        loadMetodosPagamento()
      ])
    }
  }, [user])
  
  // ============================================
  // FUNÇÕES DE CARREGAMENTO DE DADOS
  // ============================================
  
  const loadTransacoes = useCallback(async () => {
    if (!user) return
    
    setLoadingStates(prev => ({ ...prev, transacoes: true }))
    try {
      const { data, error } = await supabase
        .from('transacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setTransacoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      setError('Erro ao carregar transações')
    } finally {
      setLoadingStates(prev => ({ ...prev, transacoes: false }))
    }
  }, [user, supabase])
  
  const loadCategorias = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, categorias: true }))
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .eq('ativa', true)
        .order('nome')

      if (error) throw error
      setCategorias(data || [])
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, categorias: false }))
    }
  }, [supabase])
  
  const loadMetodosPagamento = useCallback(async () => {
    setLoadingStates(prev => ({ ...prev, metodos: true }))
    try {
      const { data, error } = await supabase
        .from('metodos_pagamento')
        .select('*')
        .eq('ativo', true)
        .order('nome')

      if (error) throw error
      setMetodosPagamento(data || [])
    } catch (error) {
      console.error('Erro ao carregar métodos de pagamento:', error)
    } finally {
      setLoadingStates(prev => ({ ...prev, metodos: false }))
    }
  }, [supabase])
  
  // ============================================
  // CÁLCULOS E DADOS PROCESSADOS
  // ============================================
  
  // Filtrar e ordenar transações
  const transacoesFiltradas = useMemo(() => {
    let filtered = [...transacoes]

    // Filtro por busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(transacao =>
        transacao.descricao.toLowerCase().includes(term) ||
        transacao.categoria_nome?.toLowerCase().includes(term) ||
        transacao.observacoes?.toLowerCase().includes(term)
      )
    }

    // Filtros avançados
    if (filtros.categoria) {
      filtered = filtered.filter(t => t.categoria_nome === filtros.categoria)
    }

    if (filtros.tipo) {
      filtered = filtered.filter(t => t.tipo === filtros.tipo)
    }

    if (filtros.metodosPagamento.length > 0) {
      filtered = filtered.filter(t => 
        filtros.metodosPagamento.includes(t.metodo_pagamento_nome || 'Outros')
      )
    }

    if (filtros.dataInicio) {
      filtered = filtered.filter(t => t.data >= filtros.dataInicio)
    }

    if (filtros.dataFim) {
      filtered = filtered.filter(t => t.data <= filtros.dataFim)
    }

    if (filtros.valorMin) {
      filtered = filtered.filter(t => t.valor >= parseFloat(filtros.valorMin))
    }

    if (filtros.valorMax) {
      filtered = filtered.filter(t => t.valor <= parseFloat(filtros.valorMax))
    }

    if (filtros.recorrente !== null) {
      filtered = filtered.filter(t => t.recorrente === filtros.recorrente)
    }

    if (filtros.favoritos) {
      filtered = filtered.filter(t => t.favorito)
    }

    // Ordenação
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'data':
          comparison = new Date(a.data).getTime() - new Date(b.data).getTime()
          break
        case 'valor':
          comparison = a.valor - b.valor
          break
        case 'categoria_nome':
          comparison = (a.categoria_nome || '').localeCompare(b.categoria_nome || '')
          break
        case 'descricao':
          comparison = a.descricao.localeCompare(b.descricao)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    return filtered
  }, [transacoes, searchTerm, filtros, sortBy, sortOrder])

  // Paginação
  const totalPages = Math.ceil(transacoesFiltradas.length / ITEMS_PER_PAGE)
  const indexOfLastItem = currentPage * ITEMS_PER_PAGE
  const indexOfFirstItem = indexOfLastItem - ITEMS_PER_PAGE
  const currentItems = transacoesFiltradas.slice(indexOfFirstItem, indexOfLastItem)

  // Resumo financeiro
  const resumo = useMemo((): Resumo => {
    const totalReceitas = transacoesFiltradas
      .filter(t => t.tipo === 'receita')
      .reduce((sum, t) => sum + t.valor, 0)
    
    const totalDespesas = transacoesFiltradas
      .filter(t => t.tipo === 'despesa')
      .reduce((sum, t) => sum + t.valor, 0)
    
    const saldo = totalReceitas - totalDespesas
    
    const despesasPorCategoria = transacoesFiltradas
      .filter(t => t.tipo === 'despesa')
      .reduce((acc, t) => {
        const categoria = t.categoria_nome || 'Outros'
        acc[categoria] = (acc[categoria] || 0) + t.valor
        return acc
      }, {} as Record<string, number>)
    
    const categoriaComMaiorGasto = Object.entries(despesasPorCategoria)
      .sort(([,a], [,b]) => b - a)[0]

    return {
      totalReceitas,
      totalDespesas,
      saldo,
      quantidade: transacoesFiltradas.length,
      categoriaComMaiorGasto: categoriaComMaiorGasto ? categoriaComMaiorGasto[0] : null,
      valorMaiorGasto: categoriaComMaiorGasto ? categoriaComMaiorGasto[1] : 0
    }
  }, [transacoesFiltradas])

  // ============================================
  // FUNÇÕES DE MANIPULAÇÃO DE DADOS
  // ============================================

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setLoadingStates(prev => ({ ...prev, salvando: true }))
    try {
      const transacaoData = {
        descricao: formData.descricao.trim(),
        valor: parseFloat(formData.valor),
        tipo: formData.tipo,
        categoria_nome: formData.categoria_nome || null,
        metodo_pagamento_nome: formData.metodo_pagamento_nome || null,
        data: formData.data,
        observacoes: formData.observacoes.trim() || null,
        recorrente: formData.recorrente,
        favorito: formData.favorito,
        user_id: user.id
      }

      if (editandoTransacao) {
        const { error } = await supabase
          .from('transacoes')
          .update(transacaoData)
          .eq('id', editandoTransacao.id)
          .eq('user_id', user.id)

        if (error) throw error
        setSuccess('Transação atualizada com sucesso!')
      } else {
        const { error } = await supabase
          .from('transacoes')
          .insert([transacaoData])

        if (error) throw error
        setSuccess('Transação adicionada com sucesso!')
      }

      await loadTransacoes()
      closeModal()
    } catch (error: any) {
      console.error('Erro ao salvar transação:', error)
      setError(error.message || 'Erro ao salvar transação')
    } finally {
      setLoadingStates(prev => ({ ...prev, salvando: false }))
    }
  }

  const handleDelete = async (ids: string[]) => {
    if (!user || !confirm(`Tem certeza que deseja excluir ${ids.length} transação(ões)?`)) {
      return
    }

    setLoadingStates(prev => ({ ...prev, excluindo: true }))
    try {
      const { error } = await supabase
        .from('transacoes')
        .delete()
        .in('id', ids)
        .eq('user_id', user.id)

      if (error) throw error

      await loadTransacoes()
      setTransacoesSelecionadas([])
      setSuccess(`${ids.length} transação(ões) excluída(s) com sucesso!`)
    } catch (error: any) {
      console.error('Erro ao excluir transação:', error)
      setError(error.message || 'Erro ao excluir transação')
    } finally {
      setLoadingStates(prev => ({ ...prev, excluindo: false }))
    }
  }

  const handleDuplicate = async (transacao: Transacao) => {
    if (!user) return

    try {
      const { id, user_id, created_at, updated_at, ...transacaoData } = transacao
      const novaTransacao = {
        ...transacaoData,
        descricao: `${transacao.descricao} (cópia)`,
        data: new Date().toISOString().split('T')[0],
        user_id: user.id
      }

      const { error } = await supabase
        .from('transacoes')
        .insert([novaTransacao])

      if (error) throw error

      await loadTransacoes()
      setSuccess('Transação duplicada com sucesso!')
    } catch (error: any) {
      console.error('Erro ao duplicar transação:', error)
      setError(error.message || 'Erro ao duplicar transação')
    }
  }

  const toggleFavorito = async (transacao: Transacao) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('transacoes')
        .update({ favorito: !transacao.favorito })
        .eq('id', transacao.id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadTransacoes()
    } catch (error: any) {
      console.error('Erro ao atualizar favorito:', error)
      setError(error.message || 'Erro ao atualizar favorito')
    }
  }

  // ============================================
  // FUNÇÕES DE UI E NAVEGAÇÃO
  // ============================================

  const openModal = (transacao?: Transacao) => {
    if (transacao) {
      setEditandoTransacao(transacao)
      setFormData({
        descricao: transacao.descricao,
        valor: transacao.valor.toString(),
        tipo: transacao.tipo,
        categoria_nome: transacao.categoria_nome || '',
        metodo_pagamento_nome: transacao.metodo_pagamento_nome || '',
        data: transacao.data,
        observacoes: transacao.observacoes || '',
        recorrente: transacao.recorrente,
        favorito: transacao.favorito
      })
    } else {
      setEditandoTransacao(null)
      setFormData({
        descricao: '',
        valor: '',
        tipo: 'despesa',
        categoria_nome: '',
        metodo_pagamento_nome: '',
        data: new Date().toISOString().split('T')[0],
        observacoes: '',
        recorrente: false,
        favorito: false
      })
    }
    setShowModal(true)
    setShowTemplates(false)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditandoTransacao(null)
    setShowTemplates(false)
    setError(null)
  }

  const toggleSort = (field: SortOption) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const limparFiltros = () => {
    setSearchTerm('')
    setFiltros({
      categoria: '',
      tipo: '',
      metodosPagamento: [],
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      recorrente: null,
      favoritos: false
    })
    setCurrentPage(1)
  }

  const aplicarTemplate = (template: typeof TEMPLATES_RAPIDOS[0]) => {
    setFormData(prev => ({
      ...prev,
      descricao: template.descricao,
      categoria_nome: template.categoria,
      valor: template.valor,
      tipo: template.tipo
    }))
    setShowTemplates(false)
  }

  const exportarCSV = () => {
    const headers = ['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor', 'Método', 'Observações']
    const rows = transacoesFiltradas.map(t => [
      t.data,
      t.descricao,
      t.categoria_nome || '',
      t.tipo,
      t.valor.toString(),
      t.metodo_pagamento_nome || '',
      t.observacoes || ''
    ])
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
  }

  // Limpar mensagens de sucesso/erro após um tempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(null), 5000)
      return () => clearTimeout(timer)
    }
  }, [success])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [error])// ============================================
  // RENDERIZAÇÃO - LOADING STATES
  // ============================================

  if (!mounted) {
    return null
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    )
  }

  if (loadingStates.transacoes) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Carregando suas transações...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================

  return (
    <div className="min-h-screen bg-background">
      {/* Alertas de Feedback */}
      {error && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-red-800 dark:text-red-200 font-medium text-sm">Erro</h4>
                <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
              </div>
              <button 
                onClick={() => setError(null)}
                className="text-red-500 hover:text-red-700 dark:hover:text-red-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="fixed top-4 right-4 z-50 max-w-md">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 shadow-lg">
            <div className="flex items-start gap-3">
              <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-green-800 dark:text-green-200 font-medium text-sm">Sucesso</h4>
                <p className="text-green-700 dark:text-green-300 text-sm mt-1">{success}</p>
              </div>
              <button 
                onClick={() => setSuccess(null)}
                className="text-green-500 hover:text-green-700 dark:hover:text-green-300 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-card border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Receipt className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-foreground">Transações</h1>
                  <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{resumo.quantidade} registros</span>
                    <span>•</span>
                    <span className={resumo.saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}>
                      {showValues ? formatCurrency(resumo.saldo) : 'R$ ••••••'} de saldo
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setModoVisualizacao(modoVisualizacao === 'lista' ? 'cards' : 'lista')}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                title={modoVisualizacao === 'lista' ? 'Ver em cards' : 'Ver em lista'}
              >
                {modoVisualizacao === 'lista' ? '⊞' : '☰'}
              </button>
              
              <button
                onClick={() => setShowValues(!showValues)}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
              >
                {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </button>
              
              <button
                onClick={exportarCSV}
                className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent"
                title="Exportar CSV"
                disabled={transacoesFiltradas.length === 0}
              >
                <Download className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => setShowFiltrosAvancados(!showFiltrosAvancados)}
                className={`p-2 transition-colors rounded-lg hover:bg-accent ${
                  showFiltrosAvancados ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-foreground'
                }`}
                title="Filtros avançados"
              >
                <Filter className="h-4 w-4" />
              </button>
              
              <button
                onClick={() => openModal()}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nova</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Cards de Resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card border border-border p-4 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-lg font-semibold text-emerald-500">
                  {showValues ? formatCurrency(resumo.totalReceitas) : 'R$ ••••••'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border p-4 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-500/10 rounded-lg">
                <TrendingDown className="h-4 w-4 text-red-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-lg font-semibold text-red-500">
                  {showValues ? formatCurrency(resumo.totalDespesas) : 'R$ ••••••'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border p-4 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${resumo.saldo >= 0 ? 'bg-primary/10' : 'bg-orange-500/10'}`}>
                <Wallet className={`h-4 w-4 ${resumo.saldo >= 0 ? 'text-primary' : 'text-orange-500'}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p className={`text-lg font-semibold ${resumo.saldo >= 0 ? 'text-primary' : 'text-orange-500'}`}>
                  {showValues ? formatCurrency(resumo.saldo) : 'R$ ••••••'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-card border border-border p-4 rounded-xl hover:shadow-md transition-all">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Tag className="h-4 w-4 text-purple-500" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Maior Gasto</p>
                <p className="text-sm font-medium text-foreground">
                  {resumo.categoriaComMaiorGasto || 'Nenhum'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {showValues ? formatCurrency(resumo.valorMaiorGasto) : 'R$ ••••••'}
                </p>
              </div>
            </div>
          </div>
        </div>{/* Barra de Busca e Filtros Rápidos */}
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por descrição, categoria ou observações..."
                  className="pl-10 w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                className="text-sm rounded-lg border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                value={filtros.categoria}
                onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
              >
                <option value="">Todas categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria.id} value={categoria.nome}>
                    {categoria.icone} {categoria.nome}
                  </option>
                ))}
              </select>
              
              <select
                className="text-sm rounded-lg border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                value={filtros.tipo}
                onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value }))}
              >
                <option value="">Todas</option>
                <option value="receita">Receitas</option>
                <option value="despesa">Despesas</option>
              </select>
              
              {(searchTerm || filtros.categoria || filtros.tipo) && (
                <button
                  onClick={limparFiltros}
                  className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-accent flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  <span className="hidden sm:inline">Limpar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filtros Avançados */}
        {showFiltrosAvancados && (
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filtros Avançados
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Data início
                </label>
                <input
                  type="date"
                  className="w-full text-sm rounded-lg border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  value={filtros.dataInicio}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Data fim
                </label>
                <input
                  type="date"
                  className="w-full text-sm rounded-lg border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  value={filtros.dataFim}
                  onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Valor mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full text-sm rounded-lg border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  value={filtros.valorMin}
                  onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              
              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Valor máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full text-sm rounded-lg border-input bg-background focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                  value={filtros.valorMax}
                  onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
                  placeholder="0,00"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    className="rounded text-primary border-input focus:ring-2 focus:ring-primary/20"
                    checked={filtros.favoritos}
                    onChange={(e) => setFiltros(prev => ({ ...prev, favoritos: e.target.checked }))}
                  />
                  Apenas favoritos
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Ações em Lote */}
        {transacoesSelecionadas.length > 0 && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <CheckCircle className="h-4 w-4 text-primary" />
                </div>
                <span className="text-sm font-medium text-primary">
                  {transacoesSelecionadas.length} transação(ões) selecionada(s)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDelete(transacoesSelecionadas)}
                  disabled={loadingStates.excluindo}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingStates.excluindo ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Trash2 className="h-3 w-3" />
                  )}
                  Excluir
                </button>
                <button
                  onClick={() => setTransacoesSelecionadas([])}
                  className="px-3 py-1.5 bg-secondary text-secondary-foreground text-sm rounded-lg hover:bg-secondary/80 transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Lista/Cards de Transações */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {modoVisualizacao === 'lista' ? (
            /* Visualização em Lista */
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-secondary/50 border-b border-border">
                  <tr>
                    <th className="w-12 px-4 py-3">
                      <input
                        type="checkbox"
                        className="rounded text-primary border-input focus:ring-2 focus:ring-primary/20"
                        checked={transacoesSelecionadas.length === currentItems.length && currentItems.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTransacoesSelecionadas(currentItems.map(t => t.id))
                          } else {
                            setTransacoesSelecionadas([])
                          }
                        }}
                      />
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleSort('data')}
                    >
                      <div className="flex items-center gap-1">
                        Data
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleSort('descricao')}
                    >
                      <div className="flex items-center gap-1">
                        Descrição
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleSort('categoria_nome')}
                    >
                      <div className="flex items-center gap-1">
                        Categoria
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Método
                    </th>
                    <th 
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-accent/50 transition-colors"
                      onClick={() => toggleSort('valor')}
                    >
                      <div className="flex items-center gap-1">
                        Valor
                        <ArrowUpDown className="h-3 w-3" />
                      </div>
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {currentItems.length > 0 ? (
                    currentItems.map((transacao) => {
                      const isReceita = transacao.tipo === 'receita'
                      const categoria = transacao.categoria_nome || 'Outros'
                      const categoriaColor = getCategoriaColor(categoria)
                      const categoriaIcon = getCategoriaIcon(categoria)
                      
                      return (
                        <tr 
                          key={transacao.id} 
                          className={`hover:bg-accent/50 transition-colors ${
                            transacoesSelecionadas.includes(transacao.id) ? 'bg-primary/5' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <input
                              type="checkbox"
                              className="rounded text-primary border-input focus:ring-2 focus:ring-primary/20"
                              checked={transacoesSelecionadas.includes(transacao.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTransacoesSelecionadas([...transacoesSelecionadas, transacao.id])
                                } else {
                                  setTransacoesSelecionadas(transacoesSelecionadas.filter(id => id !== transacao.id))
                                }
                              }}
                            />
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {formatDate(transacao.data)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {transacao.favorito && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                              {transacao.recorrente && (
                                <RefreshCw className="h-3 w-3 text-primary" />
                              )}
                              <span className="text-sm font-medium text-foreground">
                                {transacao.descricao}
                              </span>
                            </div>
                            {transacao.observacoes && (
                              <p className="text-xs text-muted-foreground mt-1 truncate max-w-xs">
                                {transacao.observacoes}
                              </p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span 
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                              style={{ 
                                backgroundColor: `${categoriaColor}15`,
                                color: categoriaColor 
                              }}
                            >
                              <span>{categoriaIcon}</span>
                              {categoria}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              {metodosPagamento.find(m => m.nome === transacao.metodo_pagamento_nome)?.icone || '💰'}
                              <span className="truncate max-w-20">
                                {transacao.metodo_pagamento_nome || 'Não informado'}
                              </span>
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-sm font-semibold ${
                              isReceita ? 'text-emerald-500' : 'text-red-500'
                            }`}>
                              {isReceita ? '+' : '-'}
                              {showValues ? formatCurrency(transacao.valor) : 'R$ ••••••'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => toggleFavorito(transacao)}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  transacao.favorito 
                                    ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                                    : 'text-muted-foreground hover:text-yellow-500 hover:bg-accent'
                                }`}
                                title={transacao.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                              >
                                <Star className={`h-3 w-3 ${transacao.favorito ? 'fill-current' : ''}`} />
                              </button>
                              <button
                                onClick={() => handleDuplicate(transacao)}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                                title="Duplicar"
                              >
                                <Copy className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => openModal(transacao)}
                                className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit className="h-3 w-3" />
                              </button>
                              <button
                                onClick={() => handleDelete([transacao.id])}
                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center">
                        <div className="flex flex-col items-center gap-4">
                          <div className="p-3 bg-muted/50 rounded-full">
                            <Receipt className="h-8 w-8 text-muted-foreground/50" />
                          </div>
                          <div>
                            <p className="text-muted-foreground font-medium">
                              {transacoes.length === 0 
                                ? 'Nenhuma transação cadastrada ainda'
                                : 'Nenhuma transação encontrada'
                              }
                            </p>
                            <p className="text-sm text-muted-foreground/70 mt-1">
                              {transacoes.length === 0 
                                ? 'Comece adicionando sua primeira transação financeira'
                                : 'Tente ajustar os filtros para encontrar o que procura'
                              }
                            </p>
                          </div>
                          <button
                            onClick={() => transacoes.length === 0 ? openModal() : limparFiltros()}
                            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                          >
                            {transacoes.length === 0 ? 'Adicionar Transação' : 'Limpar Filtros'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>) : (
            /* Visualização em Cards */
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentItems.length > 0 ? (
                  currentItems.map((transacao) => {
                    const isReceita = transacao.tipo === 'receita'
                    const categoria = transacao.categoria_nome || 'Outros'
                    const categoriaColor = getCategoriaColor(categoria)
                    const categoriaIcon = getCategoriaIcon(categoria)
                    
                    return (
                      <div 
                        key={transacao.id}
                        className={`border border-border rounded-xl p-4 hover:shadow-md transition-all ${
                          transacoesSelecionadas.includes(transacao.id) 
                            ? 'border-primary/50 bg-primary/5 shadow-sm' 
                            : 'hover:border-border/80'
                        }`}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              className="rounded text-primary border-input focus:ring-2 focus:ring-primary/20"
                              checked={transacoesSelecionadas.includes(transacao.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setTransacoesSelecionadas([...transacoesSelecionadas, transacao.id])
                                } else {
                                  setTransacoesSelecionadas(transacoesSelecionadas.filter(id => id !== transacao.id))
                                }
                              }}
                            />
                            <div className="flex items-center gap-1">
                              {transacao.favorito && (
                                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                              )}
                              {transacao.recorrente && (
                                <RefreshCw className="h-3 w-3 text-primary" />
                              )}
                            </div>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(transacao.data)}
                          </span>
                        </div>
                        
                        <h3 className="font-semibold text-foreground mb-3 line-clamp-2">
                          {transacao.descricao}
                        </h3>
                        
                        <div className="flex items-center gap-2 mb-3">
                          <span 
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                            style={{ 
                              backgroundColor: `${categoriaColor}15`,
                              color: categoriaColor 
                            }}
                          >
                            <span>{categoriaIcon}</span>
                            {categoria}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            {metodosPagamento.find(m => m.nome === transacao.metodo_pagamento_nome)?.icone || '💰'}
                            <span className="truncate max-w-24">
                              {transacao.metodo_pagamento_nome || 'Não informado'}
                            </span>
                          </span>
                          <span className={`text-lg font-bold ${
                            isReceita ? 'text-emerald-500' : 'text-red-500'
                          }`}>
                            {isReceita ? '+' : '-'}
                            {showValues ? formatCurrency(transacao.valor) : 'R$ ••••••'}
                          </span>
                        </div>
                        
                        {transacao.observacoes && (
                          <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                            {transacao.observacoes}
                          </p>
                        )}
                        
                        <div className="flex items-center justify-end gap-1 pt-2 border-t border-border/50">
                          <button
                            onClick={() => toggleFavorito(transacao)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              transacao.favorito 
                                ? 'text-yellow-500 hover:text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' 
                                : 'text-muted-foreground hover:text-yellow-500 hover:bg-accent'
                            }`}
                            title={transacao.favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
                          >
                            <Star className={`h-3 w-3 ${transacao.favorito ? 'fill-current' : ''}`} />
                          </button>
                          <button
                            onClick={() => handleDuplicate(transacao)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            title="Duplicar"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => openModal(transacao)}
                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            title="Editar"
                          >
                            <Edit className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => handleDelete([transacao.id])}
                            className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="col-span-full text-center py-12">
                    <div className="flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted/50 rounded-full">
                        <Receipt className="h-12 w-12 text-muted-foreground/50" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium mb-2">
                          {transacoes.length === 0 
                            ? 'Nenhuma transação cadastrada ainda'
                            : 'Nenhuma transação encontrada'
                          }
                        </p>
                        <p className="text-sm text-muted-foreground/70">
                          {transacoes.length === 0 
                            ? 'Comece adicionando sua primeira transação financeira'
                            : 'Tente ajustar os filtros para encontrar o que procura'
                          }
                        </p>
                      </div>
                      <button
                        onClick={() => transacoes.length === 0 ? openModal() : limparFiltros()}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
                      >
                        {transacoes.length === 0 ? 'Adicionar Transação' : 'Limpar Filtros'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="border-t border-border px-6 py-4 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a{' '}
                <span className="font-medium">{Math.min(indexOfLastItem, transacoesFiltradas.length)}</span> de{' '}
                <span className="font-medium">{transacoesFiltradas.length}</span> resultados
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page
                    if (totalPages <= 5) {
                      page = i + 1
                    } else if (currentPage <= 3) {
                      page = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i
                    } else {
                      page = currentPage - 2 + i
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                          page === currentPage
                            ? 'bg-primary text-primary-foreground shadow-sm'
                            : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }`}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed rounded-lg hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>{/* Modal de Nova/Editar Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border border-border w-full max-w-lg shadow-xl rounded-xl bg-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                {editandoTransacao ? (
                  <>
                    <Edit className="h-5 w-5" />
                    Editar Transação
                  </>
                ) : (
                  <>
                    <Plus className="h-5 w-5" />
                    Nova Transação
                  </>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {!editandoTransacao && (
                  <button
                    onClick={() => setShowTemplates(!showTemplates)}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                    title="Templates rápidos"
                  >
                    <Zap className="h-4 w-4" />
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Templates Rápidos */}
            {showTemplates && (
              <div className="mb-6 p-4 bg-accent/50 rounded-lg">
                <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Templates rápidos:
                </p>
                <div className="grid grid-cols-1 gap-2">
                  {TEMPLATES_RAPIDOS.map((template, index) => (
                    <button
                      key={index}
                      onClick={() => aplicarTemplate(template)}
                      className="p-3 text-left bg-background border border-border rounded-lg hover:bg-accent transition-colors text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-medium">{template.descricao}</span>
                          <span className="text-muted-foreground ml-2">• {template.categoria}</span>
                        </div>
                        <span className={`font-semibold ${
                          template.tipo === 'receita' ? 'text-emerald-500' : 'text-red-500'
                        }`}>
                          R$ {template.valor}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Tipo de Transação */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-3">
                  Tipo de Transação
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, tipo: 'despesa'})}
                    className={`p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                      formData.tipo === 'despesa'
                        ? 'border-red-500/50 bg-red-500/10 text-red-600 dark:text-red-400'
                        : 'border-border text-muted-foreground hover:border-border/80 hover:bg-accent/50'
                    }`}
                  >
                    <TrendingDown className="h-5 w-5 mx-auto mb-2" />
                    Despesa
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({...formData, tipo: 'receita'})}
                    className={`p-4 rounded-xl border-2 transition-all text-sm font-medium ${
                      formData.tipo === 'receita'
                        ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : 'border-border text-muted-foreground hover:border-border/80 hover:bg-accent/50'
                    }`}
                  >
                    <TrendingUp className="h-5 w-5 mx-auto mb-2" />
                    Receita
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Descrição */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Descrição *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Ex: Almoço no restaurante"
                  />
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Valor * (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    placeholder="0,00"
                  />
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    value={formData.categoria_nome}
                    onChange={(e) => setFormData({...formData, categoria_nome: e.target.value})}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias
                      .filter(categoria => 
                        categoria.tipo === 'ambos' || categoria.tipo === formData.tipo
                      )
                      .map(categoria => (
                        <option key={categoria.id} value={categoria.nome}>
                          {categoria.icone} {categoria.nome}
                        </option>
                      ))
                    }
                  </select>
                </div>

                {/* Método de Pagamento */}
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Método de Pagamento
                  </label>
                  <select
                    className="w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
                    value={formData.metodo_pagamento_nome}
                    onChange={(e) => setFormData({...formData, metodo_pagamento_nome: e.target.value})}
                  >
                    <option value="">Selecione um método</option>
                    {metodosPagamento.map(metodo => (
                      <option key={metodo.id} value={metodo.nome}>
                        {metodo.icone} {metodo.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Observações */}
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Observações
                  </label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors resize-none"
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Informações adicionais (opcional)"
                  />
                </div>

                {/* Opções Adicionais */}
                <div className="col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-primary border-input focus:ring-2 focus:ring-primary/20"
                      checked={formData.recorrente}
                      onChange={(e) => setFormData({...formData, recorrente: e.target.checked})}
                    />
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <RefreshCw className="h-3 w-3" />
                      Transação recorrente
                    </span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded text-yellow-500 border-input focus:ring-2 focus:ring-yellow-500/20"
                      checked={formData.favorito}
                      onChange={(e) => setFormData({...formData, favorito: e.target.checked})}
                    />
                    <span className="text-sm text-muted-foreground flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      Adicionar aos favoritos
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t border-border">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={loadingStates.salvando}
                  className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingStates.salvando}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loadingStates.salvando ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {editandoTransacao ? 'Atualizar' : 'Salvar'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
