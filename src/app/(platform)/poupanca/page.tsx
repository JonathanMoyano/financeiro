'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  PiggyBank,
  Plus,
  Edit,
  Trash2,
  TrendingUp,
  Calendar,
  DollarSign,
  AlertCircle,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

interface Saving {
  id: string
  descricao: string
  valor_objetivo: number
  valor_atual: number
  data_objetivo: string
  categoria: string
  user_id: string
  created_at: string
}

export default function SavingsPage() {
  const [savings, setSavings] = useState<Saving[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [editingSaving, setEditingSaving] = useState<Saving | null>(null)
  const [contributingSaving, setContributingSaving] = useState<Saving | null>(null)
  
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Form data
  const [formData, setFormData] = useState({
    descricao: '',
    valor_objetivo: '',
    valor_atual: '',
    data_objetivo: '',
    categoria: ''
  })

  const [contributeAmount, setContributeAmount] = useState('')

  const categorias = [
    'Emergência',
    'Viagem',
    'Casa própria',
    'Educação',
    'Aposentadoria',
    'Investimento',
    'Outros'
  ]

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('🔄 Usuário não autenticado, redirecionando para login...')
      router.push('/login')
    }
  }, [user, authLoading, router])

  // Função para buscar poupanças
  const fetchSavings = async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      console.log('🔍 Buscando poupanças para usuário:', user.id)

      const { data, error: fetchError } = await supabase
        .from('poupanca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw fetchError
      }

      console.log('✅ Poupanças carregadas:', data?.length || 0)
      setSavings(data || [])
    } catch (err: any) {
      console.error('❌ Erro ao buscar poupanças:', err)
      setError(err.message || 'Erro ao carregar poupanças')
    } finally {
      setLoading(false)
    }
  }

  // Carregar poupanças quando usuário estiver disponível
  useEffect(() => {
    if (user && !authLoading) {
      fetchSavings()
    }
  }, [user, authLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const savingData = {
        descricao: formData.descricao,
        valor_objetivo: parseFloat(formData.valor_objetivo),
        valor_atual: parseFloat(formData.valor_atual || '0'),
        data_objetivo: formData.data_objetivo,
        categoria: formData.categoria,
        user_id: user.id
      }

      let result
      if (editingSaving) {
        result = await supabase
          .from('poupanca')
          .update(savingData)
          .eq('id', editingSaving.id)
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('poupanca')
          .insert([savingData])
      }

      if (result.error) {
        throw result.error
      }

      // Reset form and close modal
      setFormData({
        descricao: '',
        valor_objetivo: '',
        valor_atual: '',
        data_objetivo: '',
        categoria: ''
      })
      setShowModal(false)
      setEditingSaving(null)
      
      // Recarregar poupanças
      await fetchSavings()
    } catch (err: any) {
      console.error('❌ Erro ao salvar poupança:', err)
      setError(err.message || 'Erro ao salvar poupança')
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!contributingSaving || !user) return

    try {
      setLoading(true)
      setError(null)

      const newAmount = contributingSaving.valor_atual + parseFloat(contributeAmount)

      const { error } = await supabase
        .from('poupanca')
        .update({ valor_atual: newAmount })
        .eq('id', contributingSaving.id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      setContributeAmount('')
      setShowContributeModal(false)
      setContributingSaving(null)
      
      await fetchSavings()
    } catch (err: any) {
      console.error('❌ Erro ao contribuir:', err)
      setError(err.message || 'Erro ao fazer contribuição')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta poupança?')) {
      return
    }

    if (!user) return

    try {
      setLoading(true)

      const { error } = await supabase
        .from('poupanca')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) {
        throw error
      }

      await fetchSavings()
    } catch (err: any) {
      console.error('❌ Erro ao excluir poupança:', err)
      setError(err.message || 'Erro ao excluir poupança')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (saving: Saving) => {
    setEditingSaving(saving)
    setFormData({
      descricao: saving.descricao,
      valor_objetivo: saving.valor_objetivo.toString(),
      valor_atual: saving.valor_atual.toString(),
      data_objetivo: saving.data_objetivo,
      categoria: saving.categoria
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingSaving(null)
    setFormData({
      descricao: '',
      valor_objetivo: '',
      valor_atual: '0',
      data_objetivo: '',
      categoria: ''
    })
    setShowModal(true)
  }

  const openContributeModal = (saving: Saving) => {
    setContributingSaving(saving)
    setContributeAmount('')
    setShowContributeModal(true)
  }

  const calculateProgress = (current: number, target: number) => {
    return Math.min((current / target) * 100, 100)
  }

  // Loading inicial
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2">Carregando...</span>
      </div>
    )
  }

  // Usuário não autenticado
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso negado</h3>
          <p className="text-gray-500">Você precisa estar logado para acessar esta página.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Poupança</h1>
        <button
          onClick={openAddModal}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nova Meta
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="ml-auto text-red-600 hover:text-red-800"
          >
            ×
          </button>
        </div>
      )}

      {/* Lista de poupanças */}
      <div className="grid gap-6">
        {loading && savings.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mx-auto mb-4" />
            <p className="text-gray-500">Carregando poupanças...</p>
          </div>
        ) : savings.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <PiggyBank className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma meta de poupança</h3>
            <p className="text-gray-500 mb-4">Comece definindo suas metas financeiras</p>
            <button
              onClick={openAddModal}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              Criar primeira meta
            </button>
          </div>
        ) : (
          savings.map((saving) => {
            const progress = calculateProgress(saving.valor_atual, saving.valor_objetivo)
            const isCompleted = progress >= 100
            
            return (
              <div key={saving.id} className="bg-white shadow rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <PiggyBank className="h-6 w-6 text-green-600" />
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {saving.descricao}
                      </h3>
                      <p className="text-sm text-gray-500">{saving.categoria}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openContributeModal(saving)}
                      disabled={isCompleted}
                      className="bg-green-100 hover:bg-green-200 disabled:bg-gray-100 text-green-700 disabled:text-gray-500 px-3 py-1 rounded-md text-sm"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => openEditModal(saving)}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(saving.id)}
                      className="p-1 text-gray-400 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Progresso: {progress.toFixed(1)}%</span>
                    <span>
                      R$ {saving.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / 
                      R$ {saving.valor_objetivo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-green-600' : 'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Meta: {new Date(saving.data_objetivo).toLocaleDateString('pt-BR')}
                  </div>
                  {isCompleted && (
                    <div className="flex items-center gap-1 text-green-600 font-medium">
                      <TrendingUp className="h-4 w-4" />
                      Meta atingida!
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Modal para criar/editar meta */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              {editingSaving ? 'Editar Meta' : 'Nova Meta de Poupança'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  value={formData.descricao}
                  onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Objetivo
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  value={formData.valor_objetivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor_objetivo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor Atual
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.valor_atual}
                  onChange={(e) => setFormData(prev => ({ ...prev, valor_atual: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data Objetivo
                </label>
                <input
                  type="date"
                  required
                  value={formData.data_objetivo}
                  onChange={(e) => setFormData(prev => ({ ...prev, data_objetivo: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Categoria
                </label>
                <select
                  required
                  value={formData.categoria}
                  onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Selecione uma categoria</option>
                  {categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>
                      {categoria}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingSaving(null)
                    setFormData({
                      descricao: '',
                      valor_objetivo: '',
                      valor_atual: '',
                      data_objetivo: '',
                      categoria: ''
                    })
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                >
                  {loading ? 'Salvando...' : (editingSaving ? 'Atualizar' : 'Salvar')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para contribuir */}
      {showContributeModal && contributingSaving && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">
              Contribuir para: {contributingSaving.descricao}
            </h2>
            <div className="mb-4 p-3 bg-gray-50 rounded-md">
              <p className="text-sm text-gray-600">Valor atual:</p>
              <p className="text-lg font-medium">
                R$ {contributingSaving.valor_atual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Valor da contribuição
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0,00"
                />
              </div>
              {contributeAmount && (
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-gray-600">Novo valor total:</p>
                  <p className="text-lg font-medium text-green-600">
                    R$ {(contributingSaving.valor_atual + parseFloat(contributeAmount || '0')).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              )}
              <div className="flex gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeModal(false)
                    setContributingSaving(null)
                    setContributeAmount('')
                  }}
                  className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !contributeAmount}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300"
                >
                  {loading ? 'Contribuindo...' : 'Contribuir'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}