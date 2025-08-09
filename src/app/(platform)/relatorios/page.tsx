"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
} from 'recharts';
import { 
  Loader2, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  Calendar,
  Download,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  DollarSign
} from 'lucide-react';

// Types
type TransactionWithCategory = {
  id: string;
  created_at: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  categories: { name: string } | null;
};

type PeriodFilter = '7d' | '30d' | '90d' | '365d' | 'all';

// Constants
const COLORS = ['#ef4444', '#3b82f6', '#f97316', '#8b5cf6', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b'];

const PERIOD_OPTIONS = [
  { value: '7d' as PeriodFilter, label: 'Últimos 7 dias' },
  { value: '30d' as PeriodFilter, label: 'Últimos 30 dias' },
  { value: '90d' as PeriodFilter, label: 'Últimos 90 dias' },
  { value: '365d' as PeriodFilter, label: 'Último ano' },
  { value: 'all' as PeriodFilter, label: 'Todo o período' },
];

// Utility Functions
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

const getDateRange = (period: PeriodFilter) => {
  const now = new Date();
  const ranges = {
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    '365d': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    'all': new Date(2020, 0, 1), // Data bem antiga
  };
  return ranges[period];
};

// Custom Components
const MetricCard = ({ 
  title, 
  value, 
  change, 
  changeLabel,
  icon: Icon, 
  variant = "default" 
}: {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: any;
  variant?: "default" | "positive" | "negative";
}) => {
  const getVariantClasses = () => {
    switch (variant) {
      case "positive":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "negative":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  const changeColor = change && change > 0 ? 'text-emerald-600' : 'text-red-600';
  const ChangeIcon = change && change > 0 ? ArrowUpRight : ArrowDownRight;

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${getVariantClasses()}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2">
          <div className="text-2xl font-bold">{value}</div>
          {change !== undefined && changeLabel && (
            <div className={`flex items-center text-sm ${changeColor}`}>
              <ChangeIcon className="h-3 w-3 mr-1" />
              <span>{Math.abs(change).toFixed(1)}%</span>
            </div>
          )}
        </div>
        {changeLabel && (
          <p className="text-xs text-muted-foreground mt-1">{changeLabel}</p>
        )}
      </CardContent>
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border border-border rounded-lg shadow-lg p-3">
        <p className="font-medium text-sm mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-sm">
              {entry.name}: {formatter ? formatter(entry.value) : formatCurrency(entry.value)}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function ReportsPage() {
  const supabase = createClientComponentClient();
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch transactions
  const fetchTransactions = useCallback(async (currentUserId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erro ao buscar transações para relatórios:', error);
    } else {
      setTransactions(data || []);
    }
  }, [supabase]);

  useEffect(() => {
    const checkUserAndFetch = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await fetchTransactions(user.id);
      }
      setIsLoading(false);
    };
    checkUserAndFetch();
  }, [supabase, fetchTransactions]);

  // Filter transactions by period
  const filteredTransactions = useMemo(() => {
    if (selectedPeriod === 'all') return transactions;
    const cutoffDate = getDateRange(selectedPeriod);
    return transactions.filter(t => new Date(t.created_at) >= cutoffDate);
  }, [transactions, selectedPeriod]);

  // Calculate report data
  const reportData = useMemo(() => {
    if (filteredTransactions.length === 0) return null;

    // Monthly evolution
    const monthlyData: { [key: string]: { receitas: number; despesas: number; saldo: number } } = {};
    
    // Category data
    const categoryData: { [key: string]: number } = {};
    const incomeCategoryData: { [key: string]: number } = {};
    
    // Daily data for trend analysis
    const dailyData: { [key: string]: { receitas: number; despesas: number } } = {};

    let totalReceitas = 0;
    let totalDespesas = 0;
    let transactionCount = 0;

    filteredTransactions.forEach(t => {
      const date = new Date(t.created_at);
      const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
      const dayKey = date.toLocaleDateString('pt-BR');
      
      // Initialize monthly data
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { receitas: 0, despesas: 0, saldo: 0 };
      }
      
      // Initialize daily data
      if (!dailyData[dayKey]) {
        dailyData[dayKey] = { receitas: 0, despesas: 0 };
      }

      transactionCount++;

      if (t.type === 'income') {
        monthlyData[monthKey].receitas += t.amount;
        dailyData[dayKey].receitas += t.amount;
        totalReceitas += t.amount;
        
        const categoryName = t.categories?.name || 'Outras Receitas';
        incomeCategoryData[categoryName] = (incomeCategoryData[categoryName] || 0) + t.amount;
      } else {
        monthlyData[monthKey].despesas += t.amount;
        dailyData[dayKey].despesas += t.amount;
        totalDespesas += t.amount;
        
        const categoryName = t.categories?.name || 'Outras Despesas';
        categoryData[categoryName] = (categoryData[categoryName] || 0) + t.amount;
      }
    });

    // Calculate monthly balance
    Object.keys(monthlyData).forEach(key => {
      monthlyData[key].saldo = monthlyData[key].receitas - monthlyData[key].despesas;
    });

    const balanceEvolution = Object.entries(monthlyData)
      .map(([name, values]) => ({ name, ...values }))
      .reverse()
      .slice(0, 12); // Last 12 months

    const expensesByCategory = Object.entries(categoryData)
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value,
        percentage: ((value / totalDespesas) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    const incomeByCategory = Object.entries(incomeCategoryData)
      .map(([name, value]) => ({ 
        name: name.charAt(0).toUpperCase() + name.slice(1), 
        value,
        percentage: ((value / totalReceitas) * 100)
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // Daily trend (last 30 days)
    const dailyTrend = Object.entries(dailyData)
      .map(([date, values]) => ({
        date,
        ...values,
        saldo: values.receitas - values.despesas
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30);

    const saldoFinal = totalReceitas - totalDespesas;
    const avgTransaction = transactionCount > 0 ? (totalReceitas + totalDespesas) / transactionCount : 0;

    return {
      totalReceitas,
      totalDespesas,
      saldoFinal,
      avgTransaction,
      transactionCount,
      balanceEvolution,
      expensesByCategory,
      incomeByCategory,
      dailyTrend,
    };
  }, [filteredTransactions]);

  const exportData = useCallback(() => {
    if (!reportData) return;
    
    const dataToExport = {
      período: PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label,
      resumo: {
        totalReceitas: reportData.totalReceitas,
        totalDespesas: reportData.totalDespesas,
        saldoFinal: reportData.saldoFinal,
        numeroTransacoes: reportData.transactionCount
      },
      categorias: reportData.expensesByCategory
    };
    
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-financeiro-${selectedPeriod}.json`;
    a.click();
  }, [reportData, selectedPeriod]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  if (!reportData || filteredTransactions.length === 0) {
    return (
      <div className="flex-1 space-y-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
        </div>
        <Card className="flex flex-col items-center justify-center min-h-[400px] text-center">
          <BarChart3 className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado disponível</h3>
          <p className="text-muted-foreground mb-4">
            Adicione algumas transações para começar a ver seus relatórios financeiros
          </p>
          <Button asChild>
            <a href="/despesas">Adicionar Transação</a>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">
            Análise detalhada das suas finanças
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: PeriodFilter) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportData}>
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Receitas"
          value={formatCurrency(reportData.totalReceitas)}
          icon={TrendingUp}
          variant="positive"
        />
        <MetricCard
          title="Total de Despesas"
          value={formatCurrency(reportData.totalDespesas)}
          icon={TrendingDown}
          variant="negative"
        />
        <MetricCard
          title="Saldo Final"
          value={formatCurrency(reportData.saldoFinal)}
          icon={Wallet}
          variant={reportData.saldoFinal >= 0 ? "positive" : "negative"}
        />
        <MetricCard
          title="Transações"
          value={reportData.transactionCount.toString()}
          icon={Activity}
          variant="default"
        />
      </div>

      {/* Main Charts */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
          <TabsTrigger value="trends">Tendências</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Evolução Mensal
                </CardTitle>
                <CardDescription>
                  Receitas vs. Despesas ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportData.balanceEvolution}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12}
                      tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                    <Legend />
                    <Bar 
                      dataKey="receitas" 
                      name="Receitas" 
                      fill="#22c55e" 
                      radius={[4, 4, 0, 0]} 
                    />
                    <Bar 
                      dataKey="despesas" 
                      name="Despesas" 
                      fill="#ef4444" 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Saldo Acumulado
                </CardTitle>
                <CardDescription>
                  Evolução do saldo ao longo do tempo
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={reportData.balanceEvolution}>
                    <XAxis 
                      dataKey="name" 
                      stroke="#888888" 
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={12}
                      tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                    <Area
                      type="monotone"
                      dataKey="saldo"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-red-500" />
                  Despesas por Categoria
                </CardTitle>
                <CardDescription>
                  Onde você mais gasta seu dinheiro
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={reportData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                    >
                      {reportData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChartIcon className="h-5 w-5 text-green-500" />
                  Receitas por Categoria
                </CardTitle>
                <CardDescription>
                  Suas principais fontes de renda
                </CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                {reportData.incomeByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={reportData.incomeByCategory}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={120}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                      >
                        {reportData.incomeByCategory.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <DollarSign className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma receita no período selecionado</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Category Rankings */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Despesas</CardTitle>
                <CardDescription>Categorias com maior gasto</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.expensesByCategory.slice(0, 5).map((category, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-8 h-8 rounded-full text-xs font-medium text-white" 
                             style={{ backgroundColor: COLORS[index % COLORS.length] }}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {category.percentage.toFixed(1)}% do total
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(category.value)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Top Receitas</CardTitle>
                <CardDescription>Principais fontes de renda</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {reportData.incomeByCategory.length > 0 ? (
                    reportData.incomeByCategory.slice(0, 5).map((category, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-green-500 text-xs font-medium text-white">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {category.percentage.toFixed(1)}% do total
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-green-600">{formatCurrency(category.value)}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-8">
                      Nenhuma receita no período selecionado
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Tendência Diária
              </CardTitle>
              <CardDescription>
                Fluxo de caixa dos últimos 30 dias
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={reportData.dailyTrend}>
                  <XAxis 
                    dataKey="date" 
                    stroke="#888888" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  />
                  <YAxis 
                    stroke="#888888" 
                    fontSize={12}
                    tickFormatter={value => `${(value / 1000).toFixed(0)}k`}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip content={<CustomTooltip formatter={formatCurrency} />} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="receitas"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                    name="Receitas"
                  />
                  <Line
                    type="monotone"
                    dataKey="despesas"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    name="Despesas"
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 5 }}
                    name="Saldo Diário"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}