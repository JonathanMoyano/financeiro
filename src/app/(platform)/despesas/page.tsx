'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Plus, 
  Search, 
  Filter, 
  TrendingDown, 
  TrendingUp,
  PiggyBank,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Interfaces
interface Transacao {
  id: string
  user_id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data: string
  observacoes?: string
  metodo_pagamento?: string
  recorrente: boolean
  favorito: boolean
  created_at: string
  updated_at: string
}

interface NovaTransacao {
  descricao: string
  valor: string
  tipo: 'receita' | 'despesa'
  categoria: string
  data: string
  observacoes: string
  metodo_pagamento: string
  recorrente: boolean
  favorito: boolean
}

interface Categoria {
  id: string
  nome: string
  tipo: 'receita' | 'despesa'
  icone: string
  cor: string
  ativa: boolean
}

interface Filtros {
  tipo: 'todos' | 'receita' | 'despesa'
  categoria: string
  dataInicio: string
  dataFim: string
  valorMin: string
  valorMax: string
  busca: string
}

export default function DespesasPage() {
  const [mounted, setMounted] = useState(false)
  const [transacoes, setTransacoes] = useState<Transacao[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Paginação
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>({
    tipo: 'todos',
    categoria: '',
    dataInicio: '',
    dataFim: '',
    valorMin: '',
    valorMax: '',
    busca: ''
  })

  // Formulário de nova transação
  const [novaTransacao, setNovaTransacao] = useState<NovaTransacao>({
    descricao: '',
    valor: '',
    tipo: 'despesa',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: '',
    metodo_pagamento: '',
    recorrente: false,
    favorito: false
  })

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Verificar se está montado
  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar autenticação
  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push('/login')
    }
  }, [user, authLoading, router, mounted])

  // Carregar dados quando usuário disponível
  useEffect(() => {
    if (mounted && user && !authLoading) {
      loadCategorias()
      loadTransacoes()
    }
  }, [user, authLoading, mounted, currentPage, filtros])

  const loadCategorias = async () => {
    if (!user) return

    try {
      console.log('🏷️ Carregando categorias para usuário:', user.id)
      
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativa', true)
        .order('name')

      if (error) {
        console.error('Erro ao buscar categorias:', error)
        // Se não há categorias do usuário, criar categorias padrão
        await createDefaultCategories()
        return
      }

      const categoriasFormatadas = data?.map(cat => ({
        id: cat.id,
        nome: cat.name,
        tipo: cat.type as 'receita' | 'despesa',
        icone: cat.icon || '📁',
        cor: cat.cor || '#6b7280',
        ativa: cat.ativa
      })) || []

      setCategorias(categoriasFormatadas)
      console.log('✅ Categorias carregadas:', categoriasFormatadas.length)

      // Se não há categorias, criar padrão
      if (categoriasFormatadas.length === 0) {
        await createDefaultCategories()
      }

    } catch (error) {
      console.error('❌ Erro ao carregar categorias:', error)
      await createDefaultCategories()
    }
  }

  const createDefaultCategories = async () => {
    if (!user) return

    const categoriasDefault = [
      // Categorias de Despesa
      { name: 'Alimentação', type: 'despesa', icon: '🍽️', cor: '#ef4444' },
      { name: 'Transporte', type: 'despesa', icon: '🚗', cor: '#3b82f6' },
      { name: 'Saúde', type: 'despesa', icon: '🏥', cor: '#10b981' },
      { name: 'Educação', type: 'despesa', icon: '📚', cor: '#8b5cf6' },
      { name: 'Lazer', type: 'despesa', icon: '🎉', cor: '#f59e0b' },
      { name: 'Casa', type: 'despesa', icon: '🏠', cor: '#06b6d4' },
      { name: 'Roupas', type: 'despesa', icon: '👕', cor: '#84cc16' },
      { name: 'Outros', type: 'despesa', icon: '📦', cor: '#6b7280' },
      
      // Categorias de Receita
      { name: 'Salário', type: 'receita', icon: '💼', cor: '#10b981' },
      { name: 'Freelance', type: 'receita', icon: '💻', cor: '#3b82f6' },
      { name: 'Investimentos', type: 'receita', icon: '📈', cor: '#8b5cf6' },
      { name: 'Vendas', type: 'receita', icon: '🛒', cor: '#f59e0b' },
      { name: 'Outros', type: 'receita', icon: '💰', cor: '#6b7280' }
    ]

    try {
      console.log('🔧 Criando categorias padrão...')
      
      const { data, error } = await supabase
        .from('categories')
        .insert(
          categoriasDefault.map(cat => ({
            ...cat,
            user_id: user.id,
            ativa: true
          }))
        )
        .select()

      if (error) throw error

      console.log('✅ Categorias padrão criadas:', data?.length)
      
      // Recarregar categorias
      await loadCategorias()
      
    } catch (error) {
      console.error('❌ Erro ao criar categorias padrão:', error)
      setError('Erro ao criar categorias padrão')
    }
  }

  const loadTransacoes = async () => {
    if (!user) return

    setLoading(true)
    try {
      let query = supabase
        .from('despesas')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)

      // Aplicar filtros
      if (filtros.tipo !== 'todos') {
        query = query.eq('tipo', filtros.tipo)
      }

      if (filtros.categoria) {
        query = query.eq('categoria', filtros.categoria)
      }

      if (filtros.dataInicio) {
        query = query.gte('data', filtros.dataInicio)
      }

      if (filtros.dataFim) {
        query = query.lte('data', filtros.dataFim)
      }

      if (filtros.valorMin) {
        query = query.gte('valor', parseFloat(filtros.valorMin))
      }

      if (filtros.valorMax) {
        query = query.lte('valor', parseFloat(filtros.valorMax))
      }

      if (filtros.busca) {
        query = query.or(`descricao.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`)
      }

      // Paginação
      const from = (currentPage - 1) * itemsPerPage
      const to = from + itemsPerPage - 1

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to)

      if (error) throw error

      // Buscar também receitas se o filtro permitir
      let receitasData: any[] = []
      if (filtros.tipo === 'todos' || filtros.tipo === 'receita') {
        const { data: receitas } = await supabase
          .from('receitas')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50) // Limitar para performance

        receitasData = receitas || []
      }

      // Combinar despesas e receitas
      const todasTransacoes = [
        ...(data || []),
        ...receitasData
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

      setTransacoes(todasTransacoes)
      setTotalPages(Math.ceil((count || 0) / itemsPerPage))

    } catch (error) {
      console.error('Erro ao carregar transações:', error)
      setError('Erro ao carregar transações')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const valor = parseFloat(novaTransacao.valor)
      if (isNaN(valor) || valor <= 0) {
        setError('Por favor, insira um valor válido.')
        return
      }

      const transacaoData = {
        user_id: user.id,
        descricao: novaTransacao.descricao,
        valor: valor,
        tipo: novaTransacao.tipo,
        categoria: novaTransacao.categoria,
        data: novaTransacao.data,
        observacoes: novaTransacao.observacoes || null,
        metodo_pagamento: novaTransacao.metodo_pagamento || null,
        recorrente: novaTransacao.recorrente,
        favorito: novaTransacao.favorito
      }

      // Escolher a tabela baseada no tipo
      const tabela = novaTransacao.tipo === 'receita' ? 'receitas' : 'despesas'

      let result
      if (editingId) {
        // Atualizar transação existente
        result = await supabase
          .from(tabela)
          .update(transacaoData)
          .eq('id', editingId)
          .eq('user_id', user.id)
      } else {
        // Criar nova transação
        result = await supabase
          .from(tabela)
          .insert(transacaoData)
      }

      if (result.error) throw result.error

      // Resetar formulário
      setNovaTransacao({
        descricao: '',
        valor: '',
        tipo: 'despesa',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
        observacoes: '',
        metodo_pagamento: '',
        recorrente: false,
        favorito: false
      })

      setShowModal(false)
      setEditingId(null)
      await loadTransacoes()

      setSuccess(editingId ? 'Transação atualizada com sucesso!' : 'Transação adicionada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (error: any) {
      console.error('Erro ao salvar transação:', error)
      setError('Erro ao salvar transação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string, tipo: 'receita' | 'despesa') => {
    if (!user || !confirm('Tem certeza que deseja excluir esta transação?')) return

    try {
      setLoading(true)
      
      const tabela = tipo === 'receita' ? 'receitas' : 'despesas'
      
      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadTransacoes()
      setSuccess('Transação excluída com sucesso!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (error) {
      console.error('Erro ao excluir transação:', error)
      setError('Erro ao excluir transação')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (transacao: Transacao) => {
    setNovaTransacao({
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      data: transacao.data,
      observacoes: transacao.observacoes || '',
      metodo_pagamento: transacao.metodo_pagamento || '',
      recorrente: transacao.recorrente,
      favorito: transacao.favorito
    })
    setEditingId(transacao.id)
    setShowModal(true)
  }

  const resetFiltros = () => {
    setFiltros({
      tipo: 'todos',
      categoria: '',
      dataInicio: '',
      dataFim: '',
      valorMin: '',
      valorMax: '',
      busca: ''
    })
    setCurrentPage(1)
  }

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ ••••••'
    
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  }

  const exportToCSV = () => {
    const headers = ['Data', 'Tipo', 'Descrição', 'Categoria', 'Valor', 'Observações']
    const rows = transacoes.map(t => [
      new Date(t.data).toLocaleDateString('pt-BR'),
      t.tipo === 'receita' ? 'Receita' : 'Despesa',
      t.descricao,
      t.categoria,
      t.valor.toFixed(2),
      t.observacoes || ''
    ])

    const csvContent = [headers, ...rows]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `transacoes_${new Date().toISOString().split('T')[0]}.csv`
    link.click()
  }

  // Loading inicial
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Calcular totais
  const totalReceitas = transacoes
    .filter(t => t.tipo === 'receita')
    .reduce((sum, t) => sum + t.valor, 0)

  const totalDespesas = transacoes
    .filter(t => t.tipo === 'despesa')
    .reduce((sum, t) => sum + t.valor, 0)

  const saldo = totalReceitas - totalDespesas

  // Opções de filtro corrigidas
  const filterOptions = [
    {
      label: 'Tipo',
      value: 'tipo',
      options: [
        { label: 'Receita', value: 'receita' },
        { label: 'Despesa', value: 'despesa' }
      ]
    },
    {
      label: 'Categoria',
      value: 'categoria',
      options: categorias.map(cat => ({
        label: `${cat.icone} ${cat.nome}`,
        value: cat.nome
      }))
    }
  ]

  return (
    <div className="space-y-6">
      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <div className="flex-1">
              <h4 className="text-red-800 font-medium">Erro</h4>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)}>
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div className="flex-1">
              <h4 className="text-green-800 font-medium">Sucesso</h4>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)}>
              <X className="h-4 w-4 text-green-500" />
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Transações Financeiras</h1>
          <p className="text-muted-foreground">
            Gerencie suas receitas e despesas de forma organizada
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowValues(!showValues)}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={exportToCSV}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title="Exportar para CSV"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={loadTransacoes}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={() => setShowModal(true)}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Transação
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Receitas</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(totalReceitas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-red-500/10">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Despesas</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${saldo >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <DollarSign className={`h-6 w-6 ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Saldo</p>
              <p className={`text-2xl font-bold ${saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e busca */}
      <div className="bg-card rounded-xl border p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Busca */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={filtros.busca}
                onChange={(e) => setFiltros(prev => ({ ...prev, busca: e.target.value }))}
                className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {/* Filtro por tipo */}
          <select
            value={filtros.tipo}
            onChange={(e) => setFiltros(prev => ({ ...prev, tipo: e.target.value as any }))}
            className="px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todos">Todos os tipos</option>
            <option value="receita">Receitas</option>
            <option value="despesa">Despesas</option>
          </select>

          {/* Filtro por categoria */}
          <select
            value={filtros.categoria}
            onChange={(e) => setFiltros(prev => ({ ...prev, categoria: e.target.value }))}
            className="px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(cat => (
              <option key={cat.id} value={cat.nome}>
                {cat.icone} {cat.nome}
              </option>
            ))}
          </select>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 border border-input rounded-lg bg-background hover:bg-accent transition-colors flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
          </button>

          {(filtros.categoria || filtros.dataInicio || filtros.dataFim || filtros.valorMin || filtros.valorMax || filtros.busca) && (
            <button
              onClick={resetFiltros}
              className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filtros avançados */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium mb-1">Data início</label>
              <input
                type="date"
                value={filtros.dataInicio}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataInicio: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Data fim</label>
              <input
                type="date"
                value={filtros.dataFim}
                onChange={(e) => setFiltros(prev => ({ ...prev, dataFim: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Valor mínimo</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filtros.valorMin}
                onChange={(e) => setFiltros(prev => ({ ...prev, valorMin: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Valor máximo</label>
              <input
                type="number"
                step="0.01"
                placeholder="0,00"
                value={filtros.valorMax}
                onChange={(e) => setFiltros(prev => ({ ...prev, valorMax: e.target.value }))}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        )}
      </div>

      {/* Lista de transações */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              Transações ({transacoes.length})
            </h3>
            
            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="p-2 border border-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                
                <span className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2 border border-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Carregando transações...</span>
            </div>
          ) : transacoes.length > 0 ? (
            <div className="space-y-4">
              {transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${
                      transacao.tipo === 'receita' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      {transacao.tipo === 'receita' ? (
                        <TrendingUp className="h-5 w-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{transacao.descricao}</h4>
                        {transacao.favorito && (
                          <span className="text-yellow-500">⭐</span>
                        )}
                        {transacao.recorrente && (
                          <span className="text-blue-500 text-xs bg-blue-50 px-2 py-1 rounded">
                            Recorrente
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3" />
                          {transacao.categoria}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(transacao.data).toLocaleDateString('pt-BR')}
                        </span>
                        {transacao.metodo_pagamento && (
                          <span>{transacao.metodo_pagamento}</span>
                        )}
                      </div>
                      {transacao.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {transacao.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className={`text-lg font-semibold ${
                        transacao.tipo === 'receita' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {transacao.tipo === 'receita' ? '+' : '-'}
                        {formatCurrency(transacao.valor)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transacao.created_at).toLocaleTimeString('pt-BR')}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEdit(transacao)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(transacao.id, transacao.tipo)}
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                {Object.values(filtros).some(f => f) ? 
                  'Tente ajustar os filtros para encontrar suas transações' :
                  'Comece adicionando sua primeira transação!'
                }
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Adicionar Transação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova/Editar Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-card my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingId ? 'Editar Transação' : 'Nova Transação'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingId(null)
                  setNovaTransacao({
                    descricao: '',
                    valor: '',
                    tipo: 'despesa',
                    categoria: '',
                    data: new Date().toISOString().split('T')[0],
                    observacoes: '',
                    metodo_pagamento: '',
                    recorrente: false,
                    favorito: false
                  })
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setNovaTransacao(prev => ({ ...prev, tipo: 'receita', categoria: '' }))}
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                        novaTransacao.tipo === 'receita'
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovaTransacao(prev => ({ ...prev, tipo: 'despesa', categoria: '' }))}
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                        novaTransacao.tipo === 'despesa'
                          ? 'bg-red-50 border-red-200 text-red-700'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      <TrendingDown className="h-4 w-4" />
                      Despesa
                    </button>
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Valor (R$) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={novaTransacao.valor}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, valor: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={novaTransacao.descricao}
                  onChange={(e) => setNovaTransacao(prev => ({ ...prev, descricao: e.target.value }))}
                  placeholder="Ex: Compra no supermercado"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={novaTransacao.categoria}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias
                      .filter(cat => cat.tipo === novaTransacao.tipo)
                      .map(cat => (
                        <option key={cat.id} value={cat.nome}>
                          {cat.icone} {cat.nome}
                        </option>
                      ))}
                  </select>
                  {categorias.filter(cat => cat.tipo === novaTransacao.tipo).length === 0 && (
                    <p className="text-xs text-yellow-600 mt-1">
                      Nenhuma categoria encontrada para {novaTransacao.tipo}. As categorias serão criadas automaticamente.
                    </p>
                  )}
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={novaTransacao.data}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, data: e.target.value }))}
                  />
                </div>
              </div>

              {/* Método de pagamento */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Método de Pagamento
                </label>
                <select
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={novaTransacao.metodo_pagamento}
                  onChange={(e) => setNovaTransacao(prev => ({ ...prev, metodo_pagamento: e.target.value }))}
                >
                  <option value="">Selecione um método</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                  <option value="PIX">📱 PIX</option>
                  <option value="Transferência">🏦 Transferência</option>
                  <option value="Boleto">📄 Boleto</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={novaTransacao.observacoes}
                  onChange={(e) => setNovaTransacao(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre a transação..."
                />
              </div>

              {/* Opções */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novaTransacao.recorrente}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, recorrente: e.target.checked }))}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm">Transação recorrente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novaTransacao.favorito}
                    onChange={(e) => setNovaTransacao(prev => ({ ...prev, favorito: e.target.checked }))}
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm">Marcar como favorito</span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingId(null)
                    setNovaTransacao({
                      descricao: '',
                      valor: '',
                      tipo: 'despesa',
                      categoria: '',
                      data: new Date().toISOString().split('T')[0],
                      observacoes: '',
                      metodo_pagamento: '',
                      recorrente: false,
                      favorito: false
                    })
                  }}
                  className="px-6 py-3 border border-input rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Atualizar' : 'Salvar'} Transação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}