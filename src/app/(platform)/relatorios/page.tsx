"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Download,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  ChevronDown,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  FileText,
  Share2,
  Info,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Tipos
interface Transaction {
  id: string;
  descricao: string;
  valor: number;
  categoria: string;
  data: string;
  tipo: 'receita' | 'despesa';
  forma_pagamento?: string;
  recorrente?: boolean;
}

interface CategoryData {
  categoria: string;
  valor: number;
  percentual: number;
  quantidade: number;
  media: number;
}

interface MonthlyData {
  mes: string;
  mesNumero: number;
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
  quantidadeTransacoes: number;
}

interface SavingsGoal {
  id: string;
  descricao: string;
  valor_atual: number;
  valor_objetivo: number;
  progresso: number;
  prazo?: string;
  categoria?: string;
}

interface ReportSummary {
  totalReceitas: number;
  totalDespesas: number;
  totalPoupanca: number;
  saldoAtual: number;
  economiaPercentual: number;
  mediaDiaria: number;
  projecaoMensal: number;
  totalTransacoes: number;
  categoriasPrincipais: {
    receita: string;
    despesa: string;
  };
}

interface ReportFilters {
  periodo: string;
  categorias: string[];
  tipoTransacao: 'todas' | 'receitas' | 'despesas';
  customDateRange?: {
    start: string;
    end: string;
  };
}

// Componente de Cartão Métrica
const MetricCard = ({ 
  icon: Icon, 
  label, 
  value, 
  trend, 
  color = "primary",
  showValue = true 
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  showValue?: boolean;
}) => {
  const colorClasses = {
    primary: "bg-primary/10 text-primary",
    success: "bg-emerald-500/10 text-emerald-500",
    danger: "bg-red-500/10 text-red-500",
    info: "bg-blue-500/10 text-blue-500",
    warning: "bg-amber-500/10 text-amber-500",
  };

  return (
    <div className="bg-card rounded-xl p-4 border border-border/50 hover:border-border transition-all">
      <div className="flex items-start justify-between mb-2">
        <div className={`p-2 rounded-lg ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="h-4 w-4" />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${trend.isPositive ? 'text-emerald-500' : 'text-red-500'}`}>
            {trend.isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className="text-lg font-semibold">
        {showValue ? value : "••••••"}
      </p>
    </div>
  );
};

// Componente Principal
export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'resumo' | 'detalhes' | 'analise'>('resumo');
  
  const [filters, setFilters] = useState<ReportFilters>({
    periodo: 'mes_atual',
    categorias: [],
    tipoTransacao: 'todas',
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  // Verificar autenticação
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  // Carregar dados
  useEffect(() => {
    if (user && !authLoading) {
      loadReportData();
    }
  }, [user, authLoading, filters]);

  // Função para obter range de datas
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    switch (filters.periodo) {
      case 'hoje':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'semana':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'mes_atual':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'mes_passado':
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case '3_meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        break;
      case '6_meses':
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1);
        break;
      case 'ano':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'custom':
        if (filters.customDateRange) {
          startDate = new Date(filters.customDateRange.start);
          endDate = new Date(filters.customDateRange.end);
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0],
    };
  };

  // Carregar dados do relatório
  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();

      // Buscar dados em paralelo
      const [despesasResult, receitasResult, poupancaResult] = await Promise.all([
        supabase
          .from("despesas")
          .select("*")
          .eq("user_id", user.id)
          .gte("data", start)
          .lte("data", end)
          .order("data", { ascending: false }),

        supabase
          .from("receitas")
          .select("*")
          .eq("user_id", user.id)
          .gte("data", start)
          .lte("data", end)
          .order("data", { ascending: false }),

        supabase
          .from("poupanca")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (despesasResult.error) throw despesasResult.error;
      if (receitasResult.error) throw receitasResult.error;
      if (poupancaResult.error) throw poupancaResult.error;

      // Processar transações
      const despesas: Transaction[] = (despesasResult.data || []).map(d => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor),
        categoria: d.categoria || 'Outros',
        data: d.data,
        tipo: 'despesa' as const,
        forma_pagamento: d.forma_pagamento,
        recorrente: d.recorrente,
      }));

      const receitas: Transaction[] = (receitasResult.data || []).map(r => ({
        id: r.id,
        descricao: r.descricao,
        valor: Number(r.valor),
        categoria: r.categoria || 'Outros',
        data: r.data,
        tipo: 'receita' as const,
        recorrente: r.recorrente,
      }));

      const allTransactions = [...despesas, ...receitas].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      // Processar metas de poupança
      const goals: SavingsGoal[] = (poupancaResult.data || []).map(p => ({
        id: p.id,
        descricao: p.descricao,
        valor_atual: Number(p.valor_atual || 0),
        valor_objetivo: Number(p.valor_objetivo || 1),
        progresso: Math.min((Number(p.valor_atual || 0) / Number(p.valor_objetivo || 1)) * 100, 100),
        prazo: p.prazo,
        categoria: p.categoria,
      }));

      // Calcular resumo
      const totalReceitas = receitas.reduce((sum, t) => sum + t.valor, 0);
      const totalDespesas = despesas.reduce((sum, t) => sum + t.valor, 0);
      const totalPoupanca = goals.reduce((sum, g) => sum + g.valor_atual, 0);
      const saldoAtual = totalReceitas - totalDespesas;
      
      // Calcular dias no período
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diasNoPeriodo = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
      
      const mediaDiaria = (totalReceitas - totalDespesas) / diasNoPeriodo;
      const projecaoMensal = mediaDiaria * 30;
      const economiaPercentual = totalReceitas > 0 ? (saldoAtual / totalReceitas) * 100 : 0;

      // Categoria mais frequente
      const categoriasReceita = receitas.reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const categoriasDespesa = despesas.reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const principalReceita = Object.entries(categoriasReceita).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
      const principalDespesa = Object.entries(categoriasDespesa).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

      setSummary({
        totalReceitas,
        totalDespesas,
        totalPoupanca,
        saldoAtual,
        economiaPercentual,
        mediaDiaria,
        projecaoMensal,
        totalTransacoes: allTransactions.length,
        categoriasPrincipais: {
          receita: principalReceita,
          despesa: principalDespesa,
        },
      });

      setTransactions(allTransactions);
      setSavingsGoals(goals);
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  // Processar dados por categoria
  const categoryData = useMemo(() => {
    // Filtrar transações por tipo, considerando o filtro ativo
    let despesasFiltered = transactions.filter(t => t.tipo === 'despesa');
    let receitasFiltered = transactions.filter(t => t.tipo === 'receita');

    // Aplicar filtro de tipo de transação se necessário
    if (filters.tipoTransacao === 'despesas') {
      receitasFiltered = [];
    } else if (filters.tipoTransacao === 'receitas') {
      despesasFiltered = [];
    }

    const processCategories = (items: Transaction[]): CategoryData[] => {
      const categoryMap: Record<string, { total: number; count: number; transactions: Transaction[] }> = {};
      const total = items.reduce((sum, t) => sum + t.valor, 0);

      items.forEach(item => {
        const categoria = item.categoria || 'Sem categoria';
        if (!categoryMap[categoria]) {
          categoryMap[categoria] = { total: 0, count: 0, transactions: [] };
        }
        categoryMap[categoria].total += item.valor;
        categoryMap[categoria].count += 1;
        categoryMap[categoria].transactions.push(item);
      });

      return Object.entries(categoryMap)
        .map(([categoria, data]) => ({
          categoria,
          valor: data.total,
          percentual: total > 0 ? (data.total / total) * 100 : 0,
          quantidade: data.count,
          media: data.count > 0 ? data.total / data.count : 0,
        }))
        .sort((a, b) => b.valor - a.valor);
    };

    return {
      despesas: processCategories(despesasFiltered),
      receitas: processCategories(receitasFiltered),
      todasCategorias: [...new Set([...despesasFiltered, ...receitasFiltered].map(t => t.categoria || 'Sem categoria'))],
    };
  }, [transactions, filters.tipoTransacao]);

  // Processar evolução mensal
  const monthlyEvolution = useMemo(() => {
    const monthMap: Record<string, MonthlyData> = {};

    transactions.forEach(t => {
      const date = new Date(t.data);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthMap[monthKey]) {
        monthMap[monthKey] = {
          mes: date.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }),
          mesNumero: date.getMonth() + 1,
          ano: date.getFullYear(),
          receitas: 0,
          despesas: 0,
          saldo: 0,
          quantidadeTransacoes: 0,
        };
      }

      if (t.tipo === 'receita') {
        monthMap[monthKey].receitas += t.valor;
      } else {
        monthMap[monthKey].despesas += t.valor;
      }
      monthMap[monthKey].quantidadeTransacoes += 1;
    });

    return Object.values(monthMap)
      .map(m => ({
        ...m,
        saldo: m.receitas - m.despesas,
      }))
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mesNumero - b.mesNumero;
      });
  }, [transactions]);

  // Formatar moeda
  const formatCurrency = (value: number): string => {
    if (!showValues) return "R$ ••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  // Formatar número
  const formatNumber = (value: number): string => {
    return new Intl.NumberFormat("pt-BR").format(value);
  };

  // Baixar relatório
  const handleDownload = () => {
    if (!summary) return;

    const reportData = {
      resumo: summary,
      transacoes: transactions,
      categorias: categoryData,
      evolucao: monthlyEvolution,
      metas: savingsGoals,
      periodo: getDateRange(),
      geradoEm: new Date().toISOString(),
    };

    // Gerar CSV
    const csvLines: string[] = [
      'RELATÓRIO FINANCEIRO',
      `Gerado em: ${new Date().toLocaleString('pt-BR')}`,
      '',
      'RESUMO',
      `Total de Receitas,${summary.totalReceitas.toFixed(2)}`,
      `Total de Despesas,${summary.totalDespesas.toFixed(2)}`,
      `Saldo Atual,${summary.saldoAtual.toFixed(2)}`,
      `Total em Poupança,${summary.totalPoupanca.toFixed(2)}`,
      `Taxa de Economia,${summary.economiaPercentual.toFixed(1)}%`,
      '',
      'TRANSAÇÕES RECENTES',
      'Data,Tipo,Categoria,Descrição,Valor',
      ...transactions.slice(0, 50).map(t => 
        `${new Date(t.data).toLocaleDateString('pt-BR')},${t.tipo},${t.categoria},"${t.descricao}",${t.valor.toFixed(2)}`
      ),
    ];

    const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Compartilhar relatório
  const handleShare = async () => {
    if (!summary) return;

    const shareData = {
      title: 'Relatório Financeiro',
      text: `Resumo Financeiro\n\nReceitas: ${formatCurrency(summary.totalReceitas)}\nDespesas: ${formatCurrency(summary.totalDespesas)}\nSaldo: ${formatCurrency(summary.saldoAtual)}\n\nTaxa de economia: ${summary.economiaPercentual.toFixed(1)}%`,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Compartilhamento cancelado');
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(shareData.text);
      alert('Dados copiados para a área de transferência!');
    }
  };

  // Atualizar dados
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReportData();
  };

  // Loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Carregando relatório...</p>
        </div>
      </div>
    );
  }

  // Sem dados
  if (!summary || summary.totalTransacoes === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-sm">
          <FileText className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Sem dados disponíveis</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione transações para visualizar seus relatórios financeiros
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Relatórios</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise detalhada das suas finanças
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-2 rounded-lg border hover:bg-accent transition-colors"
              aria-label={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg border hover:bg-accent transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <button
              onClick={handleDownload}
              className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 p-4 bg-card rounded-lg border">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <select
            value={filters.periodo}
            onChange={(e) => setFilters({ ...filters, periodo: e.target.value })}
            className="flex-1 min-w-[120px] max-w-[200px] px-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes_atual">Mês Atual</option>
            <option value="mes_passado">Mês Passado</option>
            <option value="3_meses">Últimos 3 Meses</option>
            <option value="6_meses">Últimos 6 Meses</option>
            <option value="ano">Este Ano</option>
          </select>

          <select
            value={filters.tipoTransacao}
            onChange={(e) => setFilters({ ...filters, tipoTransacao: e.target.value as any })}
            className="min-w-[100px] max-w-[150px] px-3 py-1.5 rounded-md border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="todas">Todas</option>
            <option value="receitas">Receitas</option>
            <option value="despesas">Despesas</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg">
          {(['resumo', 'detalhes', 'analise'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === tab
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Conteúdo baseado na tab ativa */}
        {activeTab === 'resumo' && (
          <div className="space-y-6">
            {/* Cards principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <MetricCard
                icon={TrendingUp}
                label="Receitas"
                value={formatCurrency(summary.totalReceitas)}
                color="success"
                showValue={showValues}
                trend={monthlyEvolution.length >= 2 ? {
                  value: ((monthlyEvolution[monthlyEvolution.length - 1].receitas / monthlyEvolution[monthlyEvolution.length - 2].receitas - 1) * 100),
                  isPositive: monthlyEvolution[monthlyEvolution.length - 1].receitas > monthlyEvolution[monthlyEvolution.length - 2].receitas
                } : undefined}
              />
              
              <MetricCard
                icon={TrendingDown}
                label="Despesas"
                value={formatCurrency(summary.totalDespesas)}
                color="danger"
                showValue={showValues}
                trend={monthlyEvolution.length >= 2 ? {
                  value: ((monthlyEvolution[monthlyEvolution.length - 1].despesas / monthlyEvolution[monthlyEvolution.length - 2].despesas - 1) * 100),
                  isPositive: monthlyEvolution[monthlyEvolution.length - 1].despesas < monthlyEvolution[monthlyEvolution.length - 2].despesas
                } : undefined}
              />
              
              <MetricCard
                icon={Wallet}
                label="Saldo"
                value={formatCurrency(summary.saldoAtual)}
                color={summary.saldoAtual >= 0 ? "success" : "danger"}
                showValue={showValues}
              />
              
              <MetricCard
                icon={PiggyBank}
                label="Poupança"
                value={formatCurrency(summary.totalPoupanca)}
                color="info"
                showValue={showValues}
              />
            </div>

            {/* Indicadores secundários */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="bg-card rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-1">
                  <Target className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Taxa de Economia</span>
                </div>
                <p className={`text-lg font-semibold ${summary.economiaPercentual >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                  {summary.economiaPercentual.toFixed(1)}%
                </p>
              </div>

              <div className="bg-card rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Média Diária</span>
                </div>
                <p className="text-lg font-semibold">
                  {showValues ? formatCurrency(summary.mediaDiaria) : "••••"}
                </p>
              </div>

              <div className="bg-card rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Projeção Mensal</span>
                </div>
                <p className="text-lg font-semibold">
                  {showValues ? formatCurrency(summary.projecaoMensal) : "••••"}
                </p>
              </div>

              <div className="bg-card rounded-lg p-3 border">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Transações</span>
                </div>
                <p className="text-lg font-semibold">
                  {formatNumber(summary.totalTransacoes)}
                </p>
              </div>
            </div>

            {/* Evolução mensal */}
            {monthlyEvolution.length > 0 && (
              <div className="bg-card rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Evolução Mensal</h3>
                  <p className="text-xs text-muted-foreground mt-1">Últimos {monthlyEvolution.length} meses</p>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {monthlyEvolution.slice(-6).map((month, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{month.mes}</span>
                          <div className="flex items-center gap-4">
                            <span className="text-emerald-500">
                              {showValues ? formatCurrency(month.receitas) : "••••"}
                            </span>
                            <span className="text-red-500">
                              {showValues ? formatCurrency(month.despesas) : "••••"}
                            </span>
                            <span className={`font-semibold ${month.saldo >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              {showValues ? formatCurrency(month.saldo) : "••••"}
                            </span>
                          </div>
                        </div>
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="absolute h-full bg-emerald-500/20"
                            style={{ width: '100%' }}
                          />
                          <div 
                            className="absolute h-full bg-emerald-500"
                            style={{ width: `${month.receitas > 0 ? (month.receitas / (month.receitas + month.despesas)) * 100 : 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Metas de poupança */}
            {savingsGoals.length > 0 && (
              <div className="bg-card rounded-lg border">
                <div className="p-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Metas de Poupança</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {savingsGoals.filter(g => g.progresso >= 100).length} de {savingsGoals.length} atingidas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-500">
                      {Math.round(savingsGoals.reduce((sum, g) => sum + g.progresso, 0) / savingsGoals.length)}%
                    </p>
                    <p className="text-xs text-muted-foreground">Progresso médio</p>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  {savingsGoals.slice(0, 3).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{goal.descricao}</p>
                          <p className="text-xs text-muted-foreground">
                            {showValues ? formatCurrency(goal.valor_atual) : "••••"} de {showValues ? formatCurrency(goal.valor_objetivo) : "••••"}
                          </p>
                        </div>
                        <span className={`text-sm font-semibold ${goal.progresso >= 100 ? 'text-emerald-500' : 'text-blue-500'}`}>
                          {goal.progresso.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-500 ${
                            goal.progresso >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                          }`}
                          style={{ width: `${Math.min(goal.progresso, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'detalhes' && (
          <div className="space-y-6">
            {/* Categorias de Despesas */}
            {categoryData.despesas.length > 0 && (
              <div className="bg-card rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Despesas por Categoria</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categoryData.despesas.length} categorias • {transactions.filter(t => t.tipo === 'despesa').length} transações
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {categoryData.despesas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma despesa encontrada no período selecionado
                      </p>
                    ) : (
                      categoryData.despesas.map((cat, idx) => (
                        <div key={`${cat.categoria}-${idx}`} className="flex items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{cat.categoria}</span>
                              <span className="text-sm font-semibold">
                                {showValues ? formatCurrency(cat.valor) : "••••"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{cat.quantidade} {cat.quantidade === 1 ? 'transação' : 'transações'}</span>
                              <span>{cat.percentual.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-red-500 transition-all duration-500"
                                style={{ width: `${cat.percentual}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Categorias de Receitas */}
            {categoryData.receitas.length > 0 && (
              <div className="bg-card rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Receitas por Categoria</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {categoryData.receitas.length} categorias • {transactions.filter(t => t.tipo === 'receita').length} transações
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-3">
                    {categoryData.receitas.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        Nenhuma receita encontrada no período selecionado
                      </p>
                    ) : (
                      categoryData.receitas.map((cat, idx) => (
                        <div key={`${cat.categoria}-${idx}`} className="flex items-center gap-3">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{cat.categoria}</span>
                              <span className="text-sm font-semibold">
                                {showValues ? formatCurrency(cat.valor) : "••••"}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              <span>{cat.quantidade} {cat.quantidade === 1 ? 'transação' : 'transações'}</span>
                              <span>{cat.percentual.toFixed(1)}%</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-emerald-500 transition-all duration-500"
                                style={{ width: `${cat.percentual}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Transações Recentes */}
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Transações Recentes</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimas {Math.min(10, transactions.length)} de {transactions.length} transações
                </p>
              </div>
              <div className="divide-y">
                {transactions.slice(0, 10).map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{transaction.descricao}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.data).toLocaleDateString('pt-BR')}
                          </span>
                          <span className="text-xs px-1.5 py-0.5 rounded-full bg-muted">
                            {transaction.categoria}
                          </span>
                          {transaction.recorrente && (
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-500">
                              Recorrente
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`text-sm font-semibold ${
                        transaction.tipo === 'receita' ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {transaction.tipo === 'receita' ? '+' : '-'}
                        {showValues ? formatCurrency(transaction.valor).replace('R$', '').trim() : "••••"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'analise' && (
          <div className="space-y-6">
            {/* Insights */}
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Insights Financeiros
                </h3>
              </div>
              <div className="p-4 space-y-4">
                {/* Taxa de economia */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    summary.economiaPercentual >= 20 ? 'bg-emerald-500/10' : 
                    summary.economiaPercentual >= 10 ? 'bg-amber-500/10' : 'bg-red-500/10'
                  }`}>
                    <Target className={`h-4 w-4 ${
                      summary.economiaPercentual >= 20 ? 'text-emerald-500' : 
                      summary.economiaPercentual >= 10 ? 'text-amber-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Taxa de Economia</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {summary.economiaPercentual >= 20 
                        ? `Excelente! Você está economizando ${summary.economiaPercentual.toFixed(1)}% da sua receita.`
                        : summary.economiaPercentual >= 10
                        ? `Bom! Você está economizando ${summary.economiaPercentual.toFixed(1)}% da sua receita. Tente alcançar 20%.`
                        : `Atenção! Você está economizando apenas ${summary.economiaPercentual.toFixed(1)}% da sua receita. Recomenda-se pelo menos 10%.`
                      }
                    </p>
                  </div>
                </div>

                {/* Maior categoria de gasto */}
                {categoryData.despesas.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/10">
                      <TrendingUp className="h-4 w-4 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Maior Categoria de Despesa</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {categoryData.despesas[0].categoria} representa {categoryData.despesas[0].percentual.toFixed(1)}% dos seus gastos
                        ({showValues ? formatCurrency(categoryData.despesas[0].valor) : "••••"}).
                      </p>
                    </div>
                  </div>
                )}

                {/* Tendência mensal */}
                {monthlyEvolution.length >= 2 && (
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${
                      monthlyEvolution[monthlyEvolution.length - 1].saldo > monthlyEvolution[monthlyEvolution.length - 2].saldo
                        ? 'bg-emerald-500/10' : 'bg-red-500/10'
                    }`}>
                      <Activity className={`h-4 w-4 ${
                        monthlyEvolution[monthlyEvolution.length - 1].saldo > monthlyEvolution[monthlyEvolution.length - 2].saldo
                          ? 'text-emerald-500' : 'text-red-500'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">Tendência Mensal</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {monthlyEvolution[monthlyEvolution.length - 1].saldo > monthlyEvolution[monthlyEvolution.length - 2].saldo
                          ? `Seu saldo melhorou em relação ao mês anterior! Continue assim.`
                          : `Seu saldo piorou em relação ao mês anterior. Revise seus gastos.`
                        }
                      </p>
                    </div>
                  </div>
                )}

                {/* Projeção */}
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    summary.projecaoMensal >= 0 ? 'bg-blue-500/10' : 'bg-red-500/10'
                  }`}>
                    <TrendingUp className={`h-4 w-4 ${
                      summary.projecaoMensal >= 0 ? 'text-blue-500' : 'text-red-500'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">Projeção para 30 dias</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Mantendo o ritmo atual, você {summary.projecaoMensal >= 0 ? 'economizará' : 'terá um déficit de'} {' '}
                      {showValues ? formatCurrency(Math.abs(summary.projecaoMensal)) : "••••"} nos próximos 30 dias.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Comparativo de Períodos */}
            {monthlyEvolution.length >= 2 && (
              <div className="bg-card rounded-lg border">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Comparativo de Períodos</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Variação entre {monthlyEvolution[monthlyEvolution.length - 2].mes} e {monthlyEvolution[monthlyEvolution.length - 1].mes}
                  </p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Receitas</p>
                      <p className="text-lg font-semibold text-emerald-500">
                        {((monthlyEvolution[monthlyEvolution.length - 1].receitas / monthlyEvolution[monthlyEvolution.length - 2].receitas - 1) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {showValues ? formatCurrency(monthlyEvolution[monthlyEvolution.length - 1].receitas - monthlyEvolution[monthlyEvolution.length - 2].receitas) : "••••"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Despesas</p>
                      <p className="text-lg font-semibold text-red-500">
                        {((monthlyEvolution[monthlyEvolution.length - 1].despesas / monthlyEvolution[monthlyEvolution.length - 2].despesas - 1) * 100).toFixed(1)}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {showValues ? formatCurrency(monthlyEvolution[monthlyEvolution.length - 1].despesas - monthlyEvolution[monthlyEvolution.length - 2].despesas) : "••••"}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs text-muted-foreground">Saldo</p>
                      <p className={`text-lg font-semibold ${
                        monthlyEvolution[monthlyEvolution.length - 1].saldo > monthlyEvolution[monthlyEvolution.length - 2].saldo
                          ? 'text-emerald-500' : 'text-red-500'
                      }`}>
                        {monthlyEvolution[monthlyEvolution.length - 2].saldo !== 0
                          ? ((monthlyEvolution[monthlyEvolution.length - 1].saldo / monthlyEvolution[monthlyEvolution.length - 2].saldo - 1) * 100).toFixed(1)
                          : '∞'}%
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {showValues ? formatCurrency(monthlyEvolution[monthlyEvolution.length - 1].saldo - monthlyEvolution[monthlyEvolution.length - 2].saldo) : "••••"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recomendações */}
            <div className="bg-card rounded-lg border">
              <div className="p-4 border-b">
                <h3 className="font-semibold">Recomendações Personalizadas</h3>
              </div>
              <div className="p-4 space-y-3">
                {summary.economiaPercentual < 10 && (
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5" />
                    <p className="text-sm text-muted-foreground">
                      Tente aumentar sua taxa de economia para pelo menos 10% reduzindo gastos em {categoryData.despesas[0]?.categoria || 'categorias não essenciais'}.
                    </p>
                  </div>
                )}
                
                {categoryData.despesas[0]?.percentual > 40 && (
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1.5" />
                    <p className="text-sm text-muted-foreground">
                      A categoria "{categoryData.despesas[0].categoria}" representa mais de 40% dos seus gastos. Considere revisar esses gastos.
                    </p>
                  </div>
                )}

                {savingsGoals.length === 0 && (
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                    <p className="text-sm text-muted-foreground">
                      Defina metas de poupança para ter objetivos financeiros claros e acompanhar seu progresso.
                    </p>
                  </div>
                )}

                {summary.projecaoMensal < 0 && (
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500 mt-1.5" />
                    <p className="text-sm text-muted-foreground">
                      Sua projeção indica déficit. Revise seus gastos recorrentes e busque fontes adicionais de receita.
                    </p>
                  </div>
                )}

                {transactions.filter(t => t.recorrente).length === 0 && (
                  <div className="flex items-start gap-2">
                    <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5" />
                    <p className="text-sm text-muted-foreground">
                      Marque suas transações recorrentes para ter uma visão mais clara dos seus compromissos fixos.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}