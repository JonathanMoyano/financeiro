'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { 
  PiggyBank,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Target,
  Calendar,
  DollarSign,
  FileText,
  Eye,
  EyeOff
} from 'lucide-react'

interface PoupancaMovimentacao {
  id: string
  descricao: string
  valor: number
  tipo: 'deposito' | 'saque'
  data: string
  categoria: string
  observacoes?: string
  user_id: string
  created_at: string
}

interface MetaPoupanca {
  id: string
  valor: number
  descricao: string
  data_inicio: string
  data_fim?: string
  ativa: boolean
}

const categorias = [
  'Reserva de Emergência',
  'Aposentadoria',
  'Viagem',
  'Casa Própria',
  'Investimento',
  'Educação',
  'Saúde',
  'Geral'
]

export default function PoupancaPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [movimentacoes, setMovimentacoes] = useState<PoupancaMovimentacao[]>([])
  const [filteredMovimentacoes, setFilteredMovimentacoes] = useState<PoupancaMovimentacao[]>([])
  const [metaPoupanca, setMetaPoupanca] = useState<MetaPoupanca | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showMetaModal, setShowMetaModal] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [editingMovimentacao, setEditingMovimentacao] = useState<PoupancaMovimentacao | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [selectedTipo, setSelectedTipo] = useState('')
  const [sortBy, setSortBy] = useState<'data' | 'valor' | 'tipo'>('data')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form states
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    tipo: 'deposito' as 'deposito' | 'saque',
    categoria: '',
    data: new Date().toISOString().split('T')[0],
    observacoes: ''
  })

  const [metaForm, setMetaForm] = useState({
    valor: '',
    descricao: '',
    data_fim: ''
  })

  const router = useRouter()
  const supabase = createClientComponentClient()

  // Verificar autenticação
  useEffect(() => {
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
        setLoading(false)
      } catch (error) {
        console.error('Erro inesperado:', error)
        router.push('/login')
      }
    }

    checkAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT' || !session) {
          router.push('/login')
        } else if (session?.user) {
          setUser(session.user)
          setLoading(false)
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase, router])

  // Carregar dados
  useEffect(() => {
    if (user) {
      loadMovimentacoes()
      loadMeta()
    }
  }, [user])

  // Filtrar e ordenar
  useEffect(() => {
    let filtered = [...movimentacoes]

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(mov =>
        mov.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        mov.categoria.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (mov.observacoes && mov.observacoes.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    }

    // Filtro por categoria
    if (selectedCategoria) {
      filtered = filtered.filter(mov => mov.categoria === selectedCategoria)
    }

    // Filtro por tipo
    if (selectedTipo) {
      filtered = filtered.filter(mov => mov.tipo === selectedTipo)
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
        case 'tipo':
          comparison = a.tipo.localeCompare(b.tipo)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredMovimentacoes(filtered)
    setCurrentPage(1)
  }, [movimentacoes, searchTerm, selectedCategoria, selectedTipo, sortBy, sortOrder])

  const loadMovimentacoes = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('poupanca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setMovimentacoes(data || [])
    } catch (error) {
      console.error('Erro ao carregar movimentações:', error)
    }
  }

  const loadMeta = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('metas')
        .select('*')
        .eq('user_id', user.id)
        .eq('tipo', 'poupanca')
        .eq('ativa', true)
        .single()

      if (error && error.code !== 'PGRST116') throw error

      setMetaPoupanca(data)
    } catch (error) {
      console.error('Erro ao carregar meta:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const movimentacaoData = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        tipo: formData.tipo,
        categoria: formData.categoria,
        data: formData.data,
        observacoes: formData.observacoes || null,
        user_id: user.id
      }

      if (editingMovimentacao) {
        const { error } = await supabase
          .from('poupanca')
          .update(movimentacaoData)
          .eq('id', editingMovimentacao.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('poupanca')
          .insert([movimentacaoData])

        if (error) throw error
      }

      await loadMovimentacoes()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar movimentação:', error)
      alert('Erro ao salvar movimentação. Tente novamente.')
    }
  }

  const handleMetaSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      // Desativar meta existente se houver
      if (metaPoupanca) {
        await supabase
          .from('metas')
          .update({ ativa: false })
          .eq('id', metaPoupanca.id)
      }

      const metaData = {
        user_id: user.id,
        tipo: 'poupanca',
        valor: parseFloat(metaForm.valor),
        descricao: metaForm.descricao,
        data_inicio: new Date().toISOString().split('T')[0],
        data_fim: metaForm.data_fim || null,
        ativa: true
      }

      const { error } = await supabase
        .from('metas')
        .insert([metaData])

      if (error) throw error

      await loadMeta()
      setShowMetaModal(false)
      setMetaForm({ valor: '', descricao: '', data_fim: '' })
    } catch (error) {
      console.error('Erro ao salvar meta:', error)
      alert('Erro ao salvar meta. Tente novamente.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Tem certeza que deseja excluir esta movimentação?')) return

    try {
      const { error } = await supabase
        .from('poupanca')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadMovimentacoes()
    } catch (error) {
      console.error('Erro ao excluir movimentação:', error)
      alert('Erro ao excluir movimentação. Tente novamente.')
    }
  }

  const openModal = (movimentacao?: PoupancaMovimentacao) => {
    if (movimentacao) {
      setEditingMovimentacao(movimentacao)
      setFormData({
        descricao: movimentacao.descricao,
        valor: movimentacao.valor.toString(),
        tipo: movimentacao.tipo,
        categoria: movimentacao.categoria,
        data: movimentacao.data,
        observacoes: movimentacao.observacoes || ''
      })
    } else {
      setEditingMovimentacao(null)
      setFormData({
        descricao: '',
        valor: '',
        tipo: 'deposito',
        categoria: '',
        data: new Date().toISOString().split('T')[0],
        observacoes: ''
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingMovimentacao(null)
  }

  const toggleSort = (field: 'data' | 'valor' | 'tipo') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ ••••••'
    return `R$ ${value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`
  }

  // Cálculos
  const totalDepositos = movimentacoes
    .filter(mov => mov.tipo === 'deposito')
    .reduce((sum, mov) => sum + mov.valor, 0)

  const totalSaques = movimentacoes
    .filter(mov => mov.tipo === 'saque')
    .reduce((sum, mov) => sum + mov.valor, 0)

  const saldoTotal = totalDepositos - totalSaques

  const progressoMeta = metaPoupanca ? (saldoTotal / metaPoupanca.valor) * 100 : 0

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredMovimentacoes.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredMovimentacoes.length / itemsPerPage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Minha Poupança</h1>
          <p className="text-muted-foreground">
            Controle e acompanhe suas economias
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
            onClick={() => setShowMetaModal(true)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Target className="h-4 w-4 mr-2" />
            Definir Meta
          </button>
          <button
            onClick={() => openModal()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nova Movimentação
          </button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Saldo Total</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(saldoTotal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Depósitos</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(totalDepositos)}
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
              <p className="text-sm text-muted-foreground mb-1">Total Saques</p>
              <p className="text-2xl font-bold text-red-500">
                {formatCurrency(totalSaques)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-orange-500/10">
              <FileText className="h-6 w-6 text-orange-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Movimentações</p>
              <p className="text-2xl font-bold text-orange-500">
                {movimentacoes.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Meta de Poupança */}
      {metaPoupanca && (
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">{metaPoupanca.descricao}</h3>
                <p className="text-sm text-muted-foreground">
                  Meta: {formatCurrency(metaPoupanca.valor)}
                </p>
              </div>
            </div>
            <span className="text-sm text-muted-foreground">
              {Math.round(progressoMeta)}% concluído
            </span>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-300 ${
                  progressoMeta >= 100 ? 'bg-emerald-500' : progressoMeta >= 75 ? 'bg-primary' : progressoMeta >= 50 ? 'bg-yellow-500' : 'bg-orange-500'
                }`}
                style={{ width: `${Math.min(progressoMeta, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Atual: {formatCurrency(saldoTotal)}</span>
              <span className="text-muted-foreground">
                Faltam: {formatCurrency(Math.max(0, metaPoupanca.valor - saldoTotal))}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-card rounded-xl p-6 border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Buscar</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar movimentações..."
                className="pl-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Categoria</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
            >
              <option value="">Todas as categorias</option>
              {categorias.map(categoria => (
                <option key={categoria} value={categoria}>{categoria}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tipo</label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="deposito">Depósito</option>
              <option value="saque">Saque</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                setSearchTerm('')
                setSelectedCategoria('')
                setSelectedTipo('')
              }}
              className="w-full px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
            >
              Limpar Filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-card rounded-xl border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-border">
            <thead className="bg-muted/50">
              <tr>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => toggleSort('data')}
                >
                  <div className="flex items-center">
                    Data
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Descrição
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Categoria
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => toggleSort('tipo')}
                >
                  <div className="flex items-center">
                    Tipo
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer hover:bg-muted"
                  onClick={() => toggleSort('valor')}
                >
                  <div className="flex items-center">
                    Valor
                    <ArrowUpDown className="ml-1 h-3 w-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {currentItems.length > 0 ? (
                currentItems.map((movimentacao) => (
                  <tr key={movimentacao.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {new Date(movimentacao.data).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium">{movimentacao.descricao}</p>
                        {movimentacao.observacoes && (
                          <p className="text-xs text-muted-foreground">{movimentacao.observacoes}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {movimentacao.categoria}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        movimentacao.tipo === 'deposito' 
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {movimentacao.tipo === 'deposito' ? (
                          <>
                            <TrendingUp className="h-3 w-3 mr-1" />
                            Depósito
                          </>
                        ) : (
                          <>
                            <TrendingDown className="h-3 w-3 mr-1" />
                            Saque
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={movimentacao.tipo === 'deposito' ? 'text-emerald-600' : 'text-red-600'}>
                        {movimentacao.tipo === 'deposito' ? '+' : '-'}
                        {formatCurrency(movimentacao.valor)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openModal(movimentacao)}
                        className="text-primary hover:text-primary/80 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(movimentacao.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-muted-foreground">
                    {movimentacoes.length === 0 
                      ? 'Nenhuma movimentação cadastrada ainda.'
                      : 'Nenhuma movimentação encontrada com os filtros aplicados.'
                    }
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md hover:bg-accent disabled:opacity-50"
              >
                Anterior
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-input text-sm font-medium rounded-md hover:bg-accent disabled:opacity-50"
              >
                Próximo
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Mostrando{' '}
                  <span className="font-medium">{indexOfFirstItem + 1}</span>
                  {' '}-{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastItem, filteredMovimentacoes.length)}
                  </span>
                  {' '}de{' '}
                  <span className="font-medium">{filteredMovimentacoes.length}</span>
                  {' '}resultados
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-primary border-primary text-primary-foreground'
                          : 'border-input hover:bg-accent'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-input text-sm font-medium hover:bg-accent disabled:opacity-50"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal Movimentação */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-card">
            <div className="mt-3">
              <h3 className="text-lg font-medium mb-4">
                {editingMovimentacao ? 'Editar Movimentação' : 'Nova Movimentação'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tipo de Movimentação
                  </label>
                  <select
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.tipo}
                    onChange={(e) => setFormData({...formData, tipo: e.target.value as 'deposito' | 'saque'})}
                  >
                    <option value="deposito">Depósito</option>
                    <option value="saque">Saque</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Ex: Reserva para emergência"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Categoria
                  </label>
                  <select
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.categoria}
                    onChange={(e) => setFormData({...formData, categoria: e.target.value})}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map(categoria => (
                      <option key={categoria} value={categoria}>{categoria}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Observações (opcional)
                  </label>
                  <textarea
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    rows={3}
                    value={formData.observacoes}
                    onChange={(e) => setFormData({...formData, observacoes: e.target.value})}
                    placeholder="Informações adicionais..."
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    {editingMovimentacao ? 'Atualizar' : 'Salvar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal Meta */}
      {showMetaModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-xl bg-card">
            <div className="mt-3">
              <h3 className="text-lg font-medium mb-4">
                Definir Meta de Poupança
              </h3>
              
              <form onSubmit={handleMetaSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Descrição da Meta
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={metaForm.descricao}
                    onChange={(e) => setMetaForm({...metaForm, descricao: e.target.value})}
                    placeholder="Ex: Casa própria, Viagem, Aposentadoria"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Valor da Meta
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={metaForm.valor}
                    onChange={(e) => setMetaForm({...metaForm, valor: e.target.value})}
                    placeholder="10000,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Data Limite (opcional)
                  </label>
                  <input
                    type="date"
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={metaForm.data_fim}
                    onChange={(e) => setMetaForm({...metaForm, data_fim: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Deixe em branco se não há prazo específico
                  </p>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowMetaModal(false)}
                    className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                  >
                    Salvar Meta
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