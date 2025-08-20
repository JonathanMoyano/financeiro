'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar,
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Printer,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  BarChart3,
  PieChart,
  Filter,
  Download,
  AlertCircle
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'

// Interfaces
interface TransactionData {
  id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data: string
  created_at: string
}

interface PoupancaData {
  id: string
  descricao: string
  valor_atual: number
  valor_objetivo: number
  categoria: string
  data_objetivo: string
  created_at: string
}

interface ReportData {
  totalReceitas: number
  totalDespesas: number
  totalPoupanca: number
  saldoFinal: number
  totalTransacoes: number
  totalMetas: number
  metasAtingidas: number
  periodo: string
  despesasPorCategoria: Array<{ categoria: string; valor: number; percentual: number }>
  receitasPorCategoria: Array<{ categoria: string; valor: number; percentual: number }>
  evolucaoMensal: Array<{ mes: string; receitas: number; despesas: number; saldo: number }>
  metasPoupanca: Array<{ descricao: string; atual: number; objetivo: number; progresso: number }>
}

export default function RelatoriosPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showValues, setShowValues] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('current_month')
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [error, setError] = useState<string | null>(null)

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
      loadReportData()
    }
  }, [user, authLoading, mounted, selectedPeriod])

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
      case 'all_time':
        startDate = new Date(2020, 0, 1)
        endDate = new Date()
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

  const loadReportData = async () => {
    if (!user) return

    setLoading(true)
    setError(null)

    try {
      console.log('📊 Carregando dados do relatório...')
      
      const { start, end } = getDateRange()
      console.log('📅 Período:', start, 'até', end)

      // Buscar todas as despesas
      const { data: despesasData, error: despesasError } = await supabase
        .from('despesas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })

      if (despesasError) {
        console.error('Erro ao buscar despesas:', despesasError)
      }

      // Buscar todas as receitas
      const { data: receitasData, error: receitasError } = await supabase
        .from('receitas')
        .select('*')
        .eq('user_id', user.id)
        .gte('data', start)
        .lte('data', end)
        .order('data', { ascending: false })

      if (receitasError) {
        console.error('Erro ao buscar receitas:', receitasError)
      }

      // Buscar todas as poupanças
      const { data: poupancaData, error: poupancaError } = await supabase
        .from('poupanca')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (poupancaError) {
        console.error('Erro ao buscar poupanças:', poupancaError)
      }

      // Processar dados
      const despesas = despesasData || []
      const receitas = receitasData || []
      const poupancas = poupancaData || []

      // Calcular totais
      const totalDespesas = despesas.reduce((sum, item) => sum + Number(item.valor), 0)
      const totalReceitas = receitas.reduce((sum, item) => sum + Number(item.valor), 0)
      const totalPoupanca = poupancas.reduce((sum, item) => sum + Number(item.valor_atual || 0), 0)
      const saldoFinal = totalReceitas - totalDespesas

      // Agrupar despesas por categoria
      const despesasPorCategoria: { [key: string]: number } = {}
      despesas.forEach(despesa => {
        const categoria = despesa.categoria || 'Outros'
        despesasPorCategoria[categoria] = (despesasPorCategoria[categoria] || 0) + Number(despesa.valor)
      })

      // Agrupar receitas por categoria
      const receitasPorCategoria: { [key: string]: number } = {}
      receitas.forEach(receita => {
        const categoria = receita.categoria || 'Outros'
        receitasPorCategoria[categoria] = (receitasPorCategoria[categoria] || 0) + Number(receita.valor)
      })

      // Criar arrays para gráficos
      const despesasArray = Object.entries(despesasPorCategoria)
        .map(([categoria, valor]) => ({
          categoria,
          valor,
          percentual: totalDespesas > 0 ? (valor / totalDespesas) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor)

      const receitasArray = Object.entries(receitasPorCategoria)
        .map(([categoria, valor]) => ({
          categoria,
          valor,
          percentual: totalReceitas > 0 ? (valor / totalReceitas) * 100 : 0
        }))
        .sort((a, b) => b.valor - a.valor)

      // Evolução mensal
      const evolucaoMensal: { [key: string]: { receitas: number; despesas: number } } = {}
      
      // Processar receitas por mês
      receitas.forEach(receita => {
        const mes = new Date(receita.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        if (!evolucaoMensal[mes]) {
          evolucaoMensal[mes] = { receitas: 0, despesas: 0 }
        }
        evolucaoMensal[mes].receitas += Number(receita.valor)
      })

      // Processar despesas por mês
      despesas.forEach(despesa => {
        const mes = new Date(despesa.data).toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
        if (!evolucaoMensal[mes]) {
          evolucaoMensal[mes] = { receitas: 0, despesas: 0 }
        }
        evolucaoMensal[mes].despesas += Number(despesa.valor)
      })

      const evolucaoArray = Object.entries(evolucaoMensal)
        .map(([mes, dados]) => ({
          mes,
          receitas: dados.receitas,
          despesas: dados.despesas,
          saldo: dados.receitas - dados.despesas
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes))

      // Metas de poupança
      const metasPoupanca = poupancas.map(meta => ({
        descricao: meta.descricao,
        atual: Number(meta.valor_atual || 0),
        objetivo: Number(meta.valor_objetivo || 0),
        progresso: Number(meta.valor_objetivo || 0) > 0 ? 
          (Number(meta.valor_atual || 0) / Number(meta.valor_objetivo || 0)) * 100 : 0
      }))

      const metasAtingidas = metasPoupanca.filter(meta => meta.progresso >= 100).length

      // Definir período
      const periodoLabels: { [key: string]: string } = {
        'current_month': 'Mês Atual',
        'last_month': 'Mês Passado',
        'last_3_months': 'Últimos 3 Meses',
        'current_year': 'Ano Atual',
        'all_time': 'Todo o Período'
      }

      const report: ReportData = {
        totalReceitas,
        totalDespesas,
        totalPoupanca,
        saldoFinal,
        totalTransacoes: despesas.length + receitas.length,
        totalMetas: poupancas.length,
        metasAtingidas,
        periodo: periodoLabels[selectedPeriod] || 'Período Selecionado',
        despesasPorCategoria: despesasArray,
        receitasPorCategoria: receitasArray,
        evolucaoMensal: evolucaoArray,
        metasPoupanca
      }

      setReportData(report)
      console.log('✅ Relatório carregado com sucesso')

    } catch (error) {
      console.error('❌ Erro ao carregar relatório:', error)
      setError('Erro ao carregar dados do relatório')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ ••••••'
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const handlePrint = () => {
    if (!reportData) return

    // Criar dados para impressão
    const printData = {
      ...reportData,
      dataGeracao: new Date().toLocaleString('pt-BR'),
      usuario: user?.email || 'Usuário'
    }

    // Salvar dados no localStorage para a página de impressão
    localStorage.setItem('printReportData', JSON.stringify(printData))
    
    // Abrir página de impressão
    const printWindow = window.open('/relatorios/print', '_blank')
    if (!printWindow) {
      alert('Popup bloqueado! Permita popups para imprimir o relatório.')
    }
  }

  const handleRefresh = () => {
    loadReportData()
  }

  const exportToPDF = () => {
    if (!reportData) return
    
    // Implementar exportação para PDF (futuramente)
    alert('Funcionalidade de exportação PDF em desenvolvimento')
  }

  // Loading inicial
  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Processando dados financeiros...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Erro ao carregar relatórios</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum dado encontrado</h3>
          <p className="text-muted-foreground mb-4">
            Não há transações para o período selecionado
          </p>
          <button
            onClick={() => router.push('/transacoes')}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md"
          >
            Adicionar Transações
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise completa das suas finanças • {reportData.periodo}
          </p>
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
              <option value="current_month">Mês Atual</option>
              <option value="last_month">Mês Passado</option>
              <option value="last_3_months">Últimos 3 Meses</option>
              <option value="current_year">Ano Atual</option>
              <option value="all_time">Todo o Período</option>
            </select>
          </div>

          <button
            onClick={() => setShowValues(!showValues)}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title={showValues ? 'Ocultar valores' : 'Mostrar valores'}
          >
            {showValues ? <Eye className="h-5 w-5" /> : <EyeOff className="h-5 w-5" />}
          </button>
          
          <button
            onClick={handleRefresh}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="h-5 w-5" />
          </button>

          <button
            onClick={exportToPDF}
            className="p-3 rounded-xl bg-card hover:bg-accent border transition-colors"
            title="Exportar PDF"
          >
            <Download className="h-5 w-5" />
          </button>
          
          <button
            onClick={handlePrint}
            className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <Printer className="h-5 w-5" />
            Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Receitas</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(reportData.totalReceitas)}
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
                {formatCurrency(reportData.totalDespesas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-xl ${reportData.saldoFinal >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
              <Wallet className={`h-6 w-6 ${reportData.saldoFinal >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Saldo Final</p>
              <p className={`text-2xl font-bold ${reportData.saldoFinal >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                {formatCurrency(reportData.saldoFinal)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Poupança Total</p>
              <p className="text-2xl font-bold text-blue-500">
                {formatCurrency(reportData.totalPoupanca)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Estatísticas detalhadas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4">Transações</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de transações:</span>
              <span className="font-medium">{reportData.totalTransacoes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Período:</span>
              <span className="font-medium">{reportData.periodo}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4">Metas de Poupança</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total de metas:</span>
              <span className="font-medium">{reportData.totalMetas}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Metas atingidas:</span>
              <span className="font-medium text-emerald-600">{reportData.metasAtingidas}</span>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4">Análise</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Taxa de economia:</span>
              <span className={`font-medium ${reportData.saldoFinal >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {reportData.totalReceitas > 0 ? 
                  `${((reportData.saldoFinal / reportData.totalReceitas) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Maior categoria:</span>
              <span className="font-medium">
                {reportData.despesasPorCategoria[0]?.categoria || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Despesas por categoria */}
      {reportData.despesasPorCategoria.length > 0 && (
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Despesas por Categoria</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.despesasPorCategoria.slice(0, 8).map((categoria, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-red-500 opacity-70"></div>
                    <span className="font-medium">{categoria.categoria}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(categoria.valor)}</div>
                    <div className="text-sm text-muted-foreground">{categoria.percentual.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Receitas por categoria */}
      {reportData.receitasPorCategoria.length > 0 && (
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Receitas por Categoria</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.receitasPorCategoria.slice(0, 8).map((categoria, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full bg-emerald-500 opacity-70"></div>
                    <span className="font-medium">{categoria.categoria}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(categoria.valor)}</div>
                    <div className="text-sm text-muted-foreground">{categoria.percentual.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Evolução mensal */}
      {reportData.evolucaoMensal.length > 0 && (
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Evolução Mensal</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.evolucaoMensal.map((mes, index) => (
                <div key={index} className="grid grid-cols-4 gap-4 py-3 border-b border-border/50 last:border-0">
                  <div className="font-medium">{mes.mes}</div>
                  <div className="text-emerald-600">{formatCurrency(mes.receitas)}</div>
                  <div className="text-red-600">{formatCurrency(mes.despesas)}</div>
                  <div className={`font-medium ${mes.saldo >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatCurrency(mes.saldo)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Metas de poupança */}
      {reportData.metasPoupanca.length > 0 && (
        <div className="bg-card rounded-xl border">
          <div className="p-6 border-b">
            <h3 className="text-lg font-semibold">Progresso das Metas de Poupança</h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {reportData.metasPoupanca.map((meta, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{meta.descricao}</span>
                    <span className="text-sm text-muted-foreground">
                      {meta.progresso.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-blue-500 transition-all duration-300"
                      style={{ width: `${Math.min(meta.progresso, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatCurrency(meta.atual)}</span>
                    <span>{formatCurrency(meta.objetivo)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}