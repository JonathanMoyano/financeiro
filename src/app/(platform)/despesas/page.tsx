'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { User } from '@supabase/supabase-js'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Tag,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

interface Despesa {
  id: string
  descricao: string
  valor: number
  categoria: string
  data: string
  user_id: string
  created_at: string
}

const categorias = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Roupas',
  'Outros'
]

export default function DespesasPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [despesas, setDespesas] = useState<Despesa[]>([])
  const [filteredDespesas, setFilteredDespesas] = useState<Despesa[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editingDespesa, setEditingDespesa] = useState<Despesa | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategoria, setSelectedCategoria] = useState('')
  const [sortBy, setSortBy] = useState<'data' | 'valor' | 'categoria'>('data')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  // Form states
  const [formData, setFormData] = useState({
    descricao: '',
    valor: '',
    categoria: '',
    data: new Date().toISOString().split('T')[0]
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

    // Listener para mudanças na autenticação
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

  // Carregar despesas
  useEffect(() => {
    if (user) {
      loadDespesas()
    }
  }, [user])

  // Filtrar e ordenar despesas
  useEffect(() => {
    let filtered = [...despesas]

    // Filtro por busca
    if (searchTerm) {
      filtered = filtered.filter(despesa =>
        despesa.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
        despesa.categoria.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro por categoria
    if (selectedCategoria) {
      filtered = filtered.filter(despesa => despesa.categoria === selectedCategoria)
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
        case 'categoria':
          comparison = a.categoria.localeCompare(b.categoria)
          break
      }

      return sortOrder === 'asc' ? comparison : -comparison
    })

    setFilteredDespesas(filtered)
    setCurrentPage(1)
  }, [despesas, searchTerm, selectedCategoria, sortBy, sortOrder])

  const loadDespesas = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setDespesas(data || [])
    } catch (error) {
      console.error('Erro ao carregar despesas:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      const despesaData = {
        descricao: formData.descricao,
        valor: parseFloat(formData.valor),
        categoria: formData.categoria,
        data: formData.data,
        user_id: user.id
      }

      if (editingDespesa) {
        // Atualizar despesa existente
        const { error } = await supabase
          .from('despesas')
          .update(despesaData)
          .eq('id', editingDespesa.id)
          .eq('user_id', user.id)

        if (error) throw error
      } else {
        // Criar nova despesa
        const { error } = await supabase
          .from('despesas')
          .insert([despesaData])

        if (error) throw error
      }

      await loadDespesas()
      closeModal()
    } catch (error) {
      console.error('Erro ao salvar despesa:', error)
      alert('Erro ao salvar despesa. Tente novamente.')
    }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Tem certeza que deseja excluir esta despesa?')) return

    try {
      const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadDespesas()
    } catch (error) {
      console.error('Erro ao excluir despesa:', error)
      alert('Erro ao excluir despesa. Tente novamente.')
    }
  }

  const openModal = (despesa?: Despesa) => {
    if (despesa) {
      setEditingDespesa(despesa)
      setFormData({
        descricao: despesa.descricao,
        valor: despesa.valor.toString(),
        categoria: despesa.categoria,
        data: despesa.data
      })
    } else {
      setEditingDespesa(null)
      setFormData({
        descricao: '',
        valor: '',
        categoria: '',
        data: new Date().toISOString().split('T')[0]
      })
    }
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingDespesa(null)
  }

  const toggleSort = (field: 'data' | 'valor' | 'categoria') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortOrder('desc')
    }
  }

  // Paginação
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentItems = filteredDespesas.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filteredDespesas.length / itemsPerPage)

  const total = despesas.reduce((sum, despesa) => sum + despesa.valor, 0)
  const totalFiltered = filteredDespesas.reduce((sum, despesa) => sum + despesa.valor, 0)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null // Componente não renderiza se não há usuário
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Minhas Despesas</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie e acompanhe seus gastos
              </p>
            </div>
            <button
              onClick={() => openModal()}
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Despesa
            </button>
          </div>

          {/* Resumo */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm font-medium text-gray-600">Total Geral</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm font-medium text-gray-600">Total Filtrado</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                R$ {totalFiltered.toFixed(2).replace('.', ',')}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <Tag className="h-5 w-5 text-gray-400" />
                <span className="ml-2 text-sm font-medium text-gray-600">Total de Itens</span>
              </div>
              <p className="mt-1 text-xl font-semibold text-gray-900">
                {filteredDespesas.length}
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Busca */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por descrição ou categoria..."
                  className="pl-10 w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro por categoria */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                value={selectedCategoria}
                onChange={(e) => setSelectedCategoria(e.target.value)}
              >
                <option value="">Todas as categorias</option>
                {categorias.map(categoria => (
                  <option key={categoria} value={categoria}>{categoria}</option>
                ))}
              </select>
            </div>

            {/* Botão limpar filtros */}
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategoria('')
                }}
                className="w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Limpar Filtros
              </button>
            </div>
          </div>
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('data')}
                  >
                    <div className="flex items-center">
                      Data
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('categoria')}
                  >
                    <div className="flex items-center">
                      Categoria
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    onClick={() => toggleSort('valor')}
                  >
                    <div className="flex items-center">
                      Valor
                      <ArrowUpDown className="ml-1 h-3 w-3" />
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map((despesa) => (
                    <tr key={despesa.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(despesa.data).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {despesa.descricao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {despesa.categoria}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        R$ {despesa.valor.toFixed(2).replace('.', ',')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => openModal(despesa)}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(despesa.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-sm text-gray-500">
                      {despesas.length === 0 
                        ? 'Nenhuma despesa cadastrada ainda.'
                        : 'Nenhuma despesa encontrada com os filtros aplicados.'
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
                  Próximo
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    Mostrando{' '}
                    <span className="font-medium">{indexOfFirstItem + 1}</span>
                    {' '}-{' '}
                    <span className="font-medium">
                      {Math.min(indexOfLastItem, filteredDespesas.length)}
                    </span>
                    {' '}de{' '}
                    <span className="font-medium">{filteredDespesas.length}</span>
                    {' '}resultados
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          page === currentPage
                            ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingDespesa ? 'Editar Despesa' : 'Nova Despesa'}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.descricao}
                    onChange={(e) => setFormData({...formData, descricao: e.target.value})}
                    placeholder="Ex: Almoço no restaurante"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.valor}
                    onChange={(e) => setFormData({...formData, valor: e.target.value})}
                    placeholder="0,00"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    value={formData.data}
                    onChange={(e) => setFormData({...formData, data: e.target.value})}
                  />
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    {editingDespesa ? 'Atualizar' : 'Salvar'}
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