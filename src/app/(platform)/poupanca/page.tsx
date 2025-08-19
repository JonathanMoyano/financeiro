'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  PiggyBank,
  Plus,
  Edit2,
  Trash2,
  TrendingUp,
  Calendar,
  Target,
  AlertCircle,
  CheckCircle,
  Loader2,
  X,
  Trophy,
  DollarSign,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Interfaces
interface Poupanca {
  id: string
  user_id: string
  descricao: string
  valor_objetivo: number
  valor_atual: number
  data_objetivo: string
  categoria: string
  observacoes?: string
  created_at: string
  updated_at: string
}

interface FormData {
  descricao: string
  valor_objetivo: string
  valor_atual: string
  data_objetivo: string
  categoria: string
  observacoes: string
}

export default function PoupancaPage() {
  const [mounted, setMounted] = useState(false)
  const [poupancas, setPoupancas] = useState<Poupanca[]>([])
  const [loading, setLoading] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Modais
  const [showModal, setShowModal] = useState(false)
  const [showContributeModal, setShowContributeModal] = useState(false)
  const [editingPoupanca, setEditingPoupanca] = useState<Poupanca | null>(null)
  const [contributingPoupanca, setContributingPoupanca] = useState<Poupanca | null>(null)
  
  // Formulários
  const [formData, setFormData] = useState<FormData>({
    descricao: '',
    valor_objetivo: '',
    valor_atual: '0',
    data_objetivo: '',
    categoria: '',
    observacoes: ''
  })
  
  const [contributeAmount, setContributeAmount] = useState('')

  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Categorias predefinidas
  const categorias = [
    { nome: 'Reserva de Emergência', icone: '🛡️', cor: '#ef4444' },
    { nome: 'Viagem', icone: '✈️', cor: '#3b82f6' },
    { nome: 'Casa Própria', icone: '🏠', cor: '#10b981' },
    { nome: 'Educação', icone: '📚', cor: '#8b5cf6' },
    { nome: 'Aposentadoria', icone: '👴', cor: '#f59e0b' },
    { nome: 'Investimento', icone: '📈', cor: '#06b6d4' },
    { nome: 'Veículo', icone: '🚗', cor: '#84cc16' },
    { nome: 'Outros', icone: '💰', cor: '#6b7280' }
  ]

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
      loadPoupancas()
    }
  }, [user, authLoading, mounted])

  const loadPoupancas = async () => {
    if (!user) return

    setLoading(true)
    try {
      console.log('💰 Carregando poupanças para usuário:', user.id)

      const { data, error } = await supabase
        .from('poupanca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setPoupancas(data || [])
      console.log('✅ Poupanças carregadas:', data?.length || 0)

    } catch (error: any) {
      console.error('❌ Erro ao carregar poupanças:', error)
      setError('Erro ao carregar suas metas de poupança')
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

      const valorObjetivo = parseFloat(formData.valor_objetivo)
      const valorAtual = parseFloat(formData.valor_atual || '0')

      if (isNaN(valorObjetivo) || valorObjetivo <= 0) {
        setError('Por favor, insira um valor objetivo válido.')
        return
      }

      if (valorAtual < 0) {
        setError('O valor atual não pode ser negativo.')
        return
      }

      const poupancaData = {
        user_id: user.id,
        descricao: formData.descricao,
        valor_objetivo: valorObjetivo,
        valor_atual: valorAtual,
        data_objetivo: formData.data_objetivo,
        categoria: formData.categoria,
        observacoes: formData.observacoes || null
      }

      let result
      if (editingPoupanca) {
        result = await supabase
          .from('poupanca')
          .update(poupancaData)
          .eq('id', editingPoupanca.id)
          .eq('user_id', user.id)
      } else {
        result = await supabase
          .from('poupanca')
          .insert(poupancaData)
      }

      if (result.error) throw result.error

      // Reset e fechar
      resetForm()
      setShowModal(false)
      setEditingPoupanca(null)
      
      await loadPoupancas()
      
      setSuccess(editingPoupanca ? 'Meta atualizada com sucesso!' : 'Meta criada com sucesso!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (error: any) {
      console.error('❌ Erro ao salvar poupança:', error)
      setError('Erro ao salvar meta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleContribute = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!contributingPoupanca || !user) return

    try {
      setLoading(true)
      setError(null)

      const contribuicao = parseFloat(contributeAmount)
      if (isNaN(contribuicao) || contribuicao <= 0) {
        setError('Por favor, insira um valor válido para contribuição.')
        return
      }

      const novoValor = contributingPoupanca.valor_atual + contribuicao

      const { error } = await supabase
        .from('poupanca')
        .update({ valor_atual: novoValor })
        .eq('id', contributingPoupanca.id)
        .eq('user_id', user.id)

      if (error) throw error

      setContributeAmount('')
      setShowContributeModal(false)
      setContributingPoupanca(null)
      
      await loadPoupancas()
      
      setSuccess(`Contribuição de ${formatCurrency(contribuicao)} adicionada com sucesso!`)
      setTimeout(() => setSuccess(null), 3000)

    } catch (error: any) {
      console.error('❌ Erro ao contribuir:', error)
      setError('Erro ao fazer contribuição. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!user || !confirm('Tem certeza que deseja excluir esta meta? Esta ação não pode ser desfeita.')) {
      return
    }

    try {
      setLoading(true)

      const { error } = await supabase
        .from('poupanca')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error

      await loadPoupancas()
      
      setSuccess('Meta excluída com sucesso!')
      setTimeout(() => setSuccess(null), 3000)

    } catch (error: any) {
      console.error('❌ Erro ao excluir poupança:', error)
      setError('Erro ao excluir meta')
    } finally {
      setLoading(false)
    }
  }

  const openEditModal = (poupanca: Poupanca) => {
    setEditingPoupanca(poupanca)
    setFormData({
      descricao: poupanca.descricao,
      valor_objetivo: poupanca.valor_objetivo.toString(),
      valor_atual: poupanca.valor_atual.toString(),
      data_objetivo: poupanca.data_objetivo,
      categoria: poupanca.categoria,
      observacoes: poupanca.observacoes || ''
    })
    setShowModal(true)
  }

  const openAddModal = () => {
    setEditingPoupanca(null)
    resetForm()
    setShowModal(true)
  }

  const openContributeModal = (poupanca: Poupanca) => {
    setContributingPoupanca(poupanca)
    setContributeAmount('')
    setShowContributeModal(true)
  }

  const resetForm = () => {
    setFormData({
      descricao: '',
      valor_objetivo: '',
      valor_atual: '0',
      data_objetivo: '',
      categoria: '',
      observacoes: ''
    })
  }

  const calculateProgress = (atual: number, objetivo: number) => {
    if (objetivo <= 0) return 0
    return Math.min((atual / objetivo) * 100, 100)
  }

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ ••••••'
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const getCategoriaInfo = (categoria: string) => {
    const info = categorias.find(cat => cat.nome === categoria)
    return info || { nome: categoria, icone: '💰', cor: '#6b7280' }
  }

  const getDaysRemaining = (dataObjetivo: string) => {
    const hoje = new Date()
    const objetivo = new Date(dataObjetivo)
    const diffTime = objetivo.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
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

  // Calcular estatísticas
  const totalPoupancas = poupancas.length
  const totalObjetivo = poupancas.reduce((sum, p) => sum + p.valor_objetivo, 0)
  const totalAtual = poupancas.reduce((sum, p) => sum + p.valor_atual, 0)
  const metasCompletas = poupancas.filter(p => calculateProgress(p.valor_atual, p.valor_objetivo) >= 100).length
  const progressoGeral = totalObjetivo > 0 ? (totalAtual / totalObjetivo) * 100 : 0

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Metas de Poupança</h1>
          <p className="text-muted-foreground">
            Defina e acompanhe suas metas financeiras de forma organizada
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
            onClick={loadPoupancas}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
          
          <button
            onClick={openAddModal}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Meta
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total de Metas</p>
              <p className="text-2xl font-bold text-blue-500">{totalPoupancas}</p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Poupado</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(totalAtual)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <PiggyBank className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Meta Total</p>
              <p className="text-2xl font-bold text-purple-500">
                {formatCurrency(totalObjetivo)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Metas Completas</p>
              <p className="text-2xl font-bold text-yellow-500">
                {metasCompletas}/{totalPoupancas}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      {totalPoupancas > 0 && (
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Progresso Geral das Metas</h3>
            <span className="text-sm text-muted-foreground">
              {progressoGeral.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-4 mb-4">
            <div 
              className="h-4 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-500"
              style={{ width: `${Math.min(progressoGeral, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Atual: {formatCurrency(totalAtual)}</span>
            <span>Objetivo: {formatCurrency(totalObjetivo)}</span>
          </div>
        </div>
      )}

      {/* Lista de metas */}
      <div className="space-y-4">
        {loading && poupancas.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando suas metas...</p>
          </div>
        ) : poupancas.length === 0 ? (
          <div className="bg-card rounded-xl p-12 text-center border">
            <PiggyBank className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Nenhuma meta de poupança</h3>
            <p className="text-muted-foreground mb-6">
              Comece definindo suas metas financeiras e acompanhe seu progresso
            </p>
            <button
              onClick={openAddModal}
              className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Criar primeira meta
            </button>
          </div>
        ) : (
          poupancas.map((poupanca) => {
            const progress = calculateProgress(poupanca.valor_atual, poupanca.valor_objetivo)
            const isCompleted = progress >= 100
            const categoriaInfo = getCategoriaInfo(poupanca.categoria)
            const daysRemaining = getDaysRemaining(poupanca.data_objetivo)
            
            return (
              <div 
                key={poupanca.id} 
                className={`bg-card rounded-xl p-6 border transition-all duration-200 hover:shadow-md ${
                  isCompleted ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div 
                      className="p-3 rounded-xl text-2xl"
                      style={{ backgroundColor: `${categoriaInfo.cor}20` }}
                    >
                      {categoriaInfo.icone}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold mb-1">{poupanca.descricao}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          {poupanca.categoria}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(poupanca.data_objetivo).toLocaleDateString('pt-BR')}
                        </span>
                        {daysRemaining > 0 ? (
                          <span className="text-blue-600">
                            {daysRemaining} dias restantes
                          </span>
                        ) : daysRemaining === 0 ? (
                          <span className="text-yellow-600 font-medium">
                            Meta vence hoje!
                          </span>
                        ) : (
                          <span className="text-red-600 font-medium">
                            Venceu há {Math.abs(daysRemaining)} dias
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!isCompleted && (
                      <button
                        onClick={() => openContributeModal(poupanca)}
                        className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Fazer contribuição"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    )}
                    <button
                      onClick={() => openEditModal(poupanca)}
                      className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                      title="Editar meta"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(poupanca.id)}
                      className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir meta"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Progresso */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">
                      Progresso: {progress.toFixed(1)}%
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(poupanca.valor_atual)} / {formatCurrency(poupanca.valor_objetivo)}
                    </span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${
                        isCompleted 
                          ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                          : progress > 75
                          ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                          : progress > 50
                          ? 'bg-gradient-to-r from-yellow-500 to-blue-500'
                          : 'bg-gradient-to-r from-red-400 to-yellow-500'
                      }`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    ></div>
                  </div>
                  
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg">
                      <Trophy className="h-4 w-4" />
                      <span>🎉 Meta atingida! Parabéns!</span>
                    </div>
                  )}
                  
                  {poupanca.observacoes && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      <strong>Observações:</strong> {poupanca.observacoes}
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-xl bg-card my-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">
                {editingPoupanca ? 'Editar Meta' : 'Nova Meta de Poupança'}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false)
                  setEditingPoupanca(null)
                  resetForm()
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium mb-2">
                    Descrição da Meta *
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.descricao}
                    onChange={(e) => setFormData(prev => ({ ...prev, descricao: e.target.value }))}
                    placeholder="Ex: Reserva de emergência"
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.categoria}
                    onChange={(e) => setFormData(prev => ({ ...prev, categoria: e.target.value }))}
                  >
                    <option value="">Selecione uma categoria</option>
                    {categorias.map((categoria) => (
                      <option key={categoria.nome} value={categoria.nome}>
                        {categoria.icone} {categoria.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data objetivo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data Objetivo *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.data_objetivo}
                    onChange={(e) => setFormData(prev => ({ ...prev, data_objetivo: e.target.value }))}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                {/* Valor objetivo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Valor Objetivo (R$) *
                  </label>
                  <input
                    type="number"
                    required
                    step="0.01"
                    min="0.01"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.valor_objetivo}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_objetivo: e.target.value }))}
                    placeholder="0,00"
                  />
                </div>

                {/* Valor atual */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Valor Atual (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={formData.valor_atual}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_atual: e.target.value }))}
                    placeholder="0,00"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Valor já economizado para esta meta
                  </p>
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre sua meta..."
                />
              </div>

              {/* Preview do progresso */}
              {formData.valor_objetivo && formData.valor_atual && (
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Preview do Progresso</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progresso atual:</span>
                      <span>
                        {calculateProgress(
                          parseFloat(formData.valor_atual || '0'),
                          parseFloat(formData.valor_objetivo || '1')
                        ).toFixed(1)}%
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="h-2 rounded-full bg-primary transition-all duration-300"
                        style={{ 
                          width: `${Math.min(
                            calculateProgress(
                              parseFloat(formData.valor_atual || '0'),
                              parseFloat(formData.valor_objetivo || '1')
                            ),
                            100
                          )}%` 
                        }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>R$ {parseFloat(formData.valor_atual || '0').toFixed(2)}</span>
                      <span>R$ {parseFloat(formData.valor_objetivo || '0').toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPoupanca(null)
                    resetForm()
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
                  {editingPoupanca ? 'Atualizar Meta' : 'Criar Meta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para contribuir */}
      {showContributeModal && contributingPoupanca && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-xl bg-card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold">Fazer Contribuição</h3>
              <button
                onClick={() => {
                  setShowContributeModal(false)
                  setContributingPoupanca(null)
                  setContributeAmount('')
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info da meta */}
            <div className="bg-muted/50 p-4 rounded-lg mb-6">
              <h4 className="font-medium mb-2">{contributingPoupanca.descricao}</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor atual:</span>
                  <span className="font-medium">{formatCurrency(contributingPoupanca.valor_atual)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Meta:</span>
                  <span className="font-medium">{formatCurrency(contributingPoupanca.valor_objetivo)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Restante:</span>
                  <span className="font-medium text-blue-600">
                    {formatCurrency(Math.max(0, contributingPoupanca.valor_objetivo - contributingPoupanca.valor_atual))}
                  </span>
                </div>
              </div>
            </div>

            <form onSubmit={handleContribute} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Valor da Contribuição (R$) *
                </label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0.01"
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="0,00"
                  autoFocus
                />
              </div>

              {/* Preview da contribuição */}
              {contributeAmount && !isNaN(parseFloat(contributeAmount)) && (
                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-emerald-800 mb-3">
                    Preview após contribuição
                  </h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Novo valor total:</span>
                      <span className="font-medium text-emerald-800">
                        {formatCurrency(contributingPoupanca.valor_atual + parseFloat(contributeAmount))}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-emerald-700">Novo progresso:</span>
                      <span className="font-medium text-emerald-800">
                        {calculateProgress(
                          contributingPoupanca.valor_atual + parseFloat(contributeAmount),
                          contributingPoupanca.valor_objetivo
                        ).toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* Barra de progresso */}
                    <div className="mt-3">
                      <div className="w-full bg-emerald-200 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                          style={{ 
                            width: `${Math.min(
                              calculateProgress(
                                contributingPoupanca.valor_atual + parseFloat(contributeAmount),
                                contributingPoupanca.valor_objetivo
                              ),
                              100
                            )}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                    
                    {/* Verificar se vai completar a meta */}
                    {(contributingPoupanca.valor_atual + parseFloat(contributeAmount)) >= contributingPoupanca.valor_objetivo && (
                      <div className="flex items-center gap-2 text-emerald-700 font-medium mt-3 p-2 bg-emerald-100 rounded">
                        <Trophy className="h-4 w-4" />
                        <span>🎉 Esta contribuição completará sua meta!</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Sugestões rápidas */}
              <div>
                <p className="text-sm font-medium mb-2">Sugestões rápidas:</p>
                <div className="grid grid-cols-2 gap-2">
                  {[50, 100, 200, 500].map(valor => (
                    <button
                      key={valor}
                      type="button"
                      onClick={() => setContributeAmount(valor.toString())}
                      className="px-3 py-2 border border-input rounded-lg text-sm hover:bg-accent transition-colors"
                    >
                      R$ {valor}
                    </button>
                  ))}
                </div>
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowContributeModal(false)
                    setContributingPoupanca(null)
                    setContributeAmount('')
                  }}
                  className="px-6 py-3 border border-input rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !contributeAmount}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  Contribuir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}