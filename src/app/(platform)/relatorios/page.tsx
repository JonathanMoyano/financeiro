"use client";

import { useState, useMemo, useEffect, useCallback } from 'react';
import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
} from 'recharts';
import { 
  Loader2, 
  Wallet, 
  Calendar,
  RefreshCw,
  Clock,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  DollarSign,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Printer, // Ícone de Impressora
} from 'lucide-react';
import { toast } from 'sonner';

// Tipos
type TransactionWithCategory = {
  id: string;
  created_at: string;
  description: string | null;
  amount: number;
  type: 'income' | 'expense';
  categories: { name: string } | null;
};

type PeriodFilter = '7d' | '30d' | '90d' | '365d' | 'all';

// Constantes
const COLORS = ['#ef4444', '#3b82f6', '#f97316', '#8b5cf6', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b'];
const PERIOD_OPTIONS = [
  { value: '7d' as PeriodFilter, label: 'Últimos 7 dias' },
  { value: '30d' as PeriodFilter, label: 'Últimos 30 dias' },
  { value: '90d' as PeriodFilter, label: 'Últimos 90 dias' },
  { value: '365d' as PeriodFilter, label: 'Último ano' },
  { value: 'all' as PeriodFilter, label: 'Todo o período' },
];

// Funções Utilitárias
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
};

const getDateRange = (period: PeriodFilter) => {
  const now = new Date();
  const ranges = {
    '7d': new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    '30d': new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    '90d': new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
    '365d': new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
    'all': new Date(2020, 0, 1),
  };
  return ranges[period];
};

// Componentes Customizados
const MetricCard = ({ title, value, icon: Icon, variant = "default" }: { title: string, value: string, icon: any, variant?: "default" | "positive" | "negative" }) => {
    const getVariantClasses = () => {
        switch (variant) {
            case "positive": return "text-emerald-600 bg-emerald-50 border-emerald-200 dark:bg-emerald-950/20 dark:border-emerald-800/30";
            case "negative": return "text-red-600 bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800/30";
            default: return "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-950/20 dark:border-blue-800/30";
        }
    };
    return (
        <Card><CardHeader className="flex flex-row items-center justify-between pb-3"><CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle><div className={`p-2.5 rounded-xl border ${getVariantClasses()}`}><Icon className="h-4 w-4" /></div></CardHeader><CardContent><div className="text-2xl font-bold">{value}</div></CardContent></Card>
    );
};

const CustomTooltip = ({ active, payload, label, formatter }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-xl shadow-xl p-4">
        <p className="font-semibold text-sm mb-3 text-foreground">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-4 mb-2 last:mb-0"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full border border-white/50" style={{ backgroundColor: entry.color }} /><span className="text-sm font-medium text-foreground">{entry.name}:</span></div><span className="text-sm font-bold text-foreground">{formatter ? formatter(entry.value) : formatCurrency(entry.value)}</span></div>
        ))}
      </div>
    );
  }
  return null;
};

const LoadingState = () => (
    <div className="flex-1 flex items-center justify-center min-h-[400px]"><div className="text-center space-y-4"><div className="relative"><Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" /><div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" /></div><div className="space-y-2"><p className="text-lg font-semibold">Carregando relatórios...</p><p className="text-sm text-muted-foreground">Processando seus dados financeiros</p></div></div></div>
);

const EmptyState = () => (
    <div className="space-y-8"><div className="flex items-center justify-between"><div><h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1><p className="text-muted-foreground">Análise detalhada das suas finanças</p></div></div><Card className="flex flex-col items-center justify-center min-h-[500px] text-center border-dashed border-2"><div className="space-y-6 max-w-md"><div className="relative"><BarChart3 className="h-20 w-20 text-muted-foreground/50 mx-auto" /><div className="absolute inset-0 bg-gradient-to-t from-muted/20 to-transparent rounded-full blur-xl" /></div><div className="space-y-3"><h3 className="text-xl font-semibold">Nenhum dado disponível</h3><p className="text-muted-foreground leading-relaxed">Adicione algumas transações para começar a visualizar seus relatórios.</p></div><Button size="lg" className="gap-2" asChild><a href="/despesas"><Wallet className="h-5 w-5" />Adicionar Transação</a></Button></div></Card></div>
);

export default function ReportsPage() {
  const [supabase] = useState(() => 
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  
  const [transactions, setTransactions] = useState<TransactionWithCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodFilter>('30d');
  const [activeTab, setActiveTab] = useState('overview');

  const fetchTransactions = useCallback(async (currentUserId: string, showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const { data, error } = await supabase.from('transactions').select('*, categories(name)').eq('user_id', currentUserId).order('created_at', { ascending: false });
      if (error) throw error;
      
      // CORREÇÃO DE TIPAGEM: Asserção de tipo para garantir a compatibilidade.
      setTransactions(data as TransactionWithCategory[] || []);

      if (showRefresh) toast.success('Relatórios atualizados!');
    } catch (error) {
      console.error('Erro ao buscar transações para relatórios:', error);
      toast.error('Erro ao carregar relatórios');
    } finally {
      if (showRefresh) setIsRefreshing(false);
    }
  }, [supabase]);

  useEffect(() => {
    let isMounted = true;
    const checkUserAndFetch = async () => {
      if (isMounted) setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (user && isMounted) await fetchTransactions(user.id);
      if (isMounted) setIsLoading(false);
    };
    checkUserAndFetch();
    return () => { isMounted = false; };
  }, [supabase, fetchTransactions]);

  const handleRefresh = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) await fetchTransactions(user.id, true);
  }, [supabase, fetchTransactions]);

  // FUNÇÃO DE IMPRESSÃO ATUALIZADA
  const handlePrint = () => {
    if (!reportData) {
      toast.error("Não há dados para imprimir.");
      return;
    }
    
    const printPayload = {
      reportData,
      periodLabel: PERIOD_OPTIONS.find(p => p.value === selectedPeriod)?.label || 'Período Completo'
    };
    
    sessionStorage.setItem('printData', JSON.stringify(printPayload));
    window.open('/relatorios/print', '_blank');
  };

  const filteredTransactions = useMemo(() => {
    if (selectedPeriod === 'all') return transactions;
    const cutoffDate = getDateRange(selectedPeriod);
    return transactions.filter(t => new Date(t.created_at) >= cutoffDate);
  }, [transactions, selectedPeriod]);

  const reportData = useMemo(() => {
    if (filteredTransactions.length === 0) return null;
    const data = {
        monthlyData: {} as { [key: string]: { receitas: number; despesas: number; saldo: number } },
        categoryData: {} as { [key: string]: number },
        incomeCategoryData: {} as { [key: string]: number },
        totalReceitas: 0,
        totalDespesas: 0,
    };
    filteredTransactions.forEach(t => {
        const date = new Date(t.created_at);
        const monthKey = date.toLocaleString('pt-BR', { month: 'short', year: '2-digit' });
        if (!data.monthlyData[monthKey]) data.monthlyData[monthKey] = { receitas: 0, despesas: 0, saldo: 0 };
        if (t.type === 'income') {
            data.monthlyData[monthKey].receitas += t.amount;
            data.totalReceitas += t.amount;
            const categoryName = t.categories?.name || 'Outras Receitas';
            data.incomeCategoryData[categoryName] = (data.incomeCategoryData[categoryName] || 0) + t.amount;
        } else {
            data.monthlyData[monthKey].despesas += t.amount;
            data.totalDespesas += t.amount;
            const categoryName = t.categories?.name || 'Outras Despesas';
            data.categoryData[categoryName] = (data.categoryData[categoryName] || 0) + t.amount;
        }
    });
    Object.keys(data.monthlyData).forEach(key => { data.monthlyData[key].saldo = data.monthlyData[key].receitas - data.monthlyData[key].despesas; });
    return {
        totalReceitas: data.totalReceitas,
        totalDespesas: data.totalDespesas,
        saldoFinal: data.totalReceitas - data.totalDespesas,
        transactionCount: filteredTransactions.length,
        balanceEvolution: Object.entries(data.monthlyData).map(([name, values]) => ({ name, ...values })).reverse().slice(0, 12),
        expensesByCategory: Object.entries(data.categoryData).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, percentage: data.totalDespesas > 0 ? (value / data.totalDespesas) * 100 : 0 })).sort((a, b) => b.value - a.value).slice(0, 8),
        incomeByCategory: Object.entries(data.incomeCategoryData).map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value, percentage: data.totalReceitas > 0 ? (value / data.totalReceitas) * 100 : 0 })).sort((a, b) => b.value - a.value).slice(0, 8),
    };
  }, [filteredTransactions]);
  
  if (isLoading) return <LoadingState />;
  if (!reportData) return <EmptyState />;

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios Financeiros</h1>
          <p className="text-muted-foreground">Análise detalhada das suas finanças • {reportData.transactionCount} transações</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={(value: PeriodFilter) => setSelectedPeriod(value)}>
            <SelectTrigger className="w-[180px]"><Clock className="h-4 w-4 mr-2" /><SelectValue /></SelectTrigger>
            <SelectContent>{PERIOD_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>))}</SelectContent>
          </Select>
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing} className="gap-2"><RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />Atualizar</Button>
          <Button variant="outline" onClick={handlePrint} className="gap-2"><Printer className="h-4 w-4" />Imprimir Relatório</Button>
        </div>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard title="Total de Receitas" value={formatCurrency(reportData.totalReceitas)} icon={TrendingUpIcon} variant="positive" />
        <MetricCard title="Total de Despesas" value={formatCurrency(reportData.totalDespesas)} icon={TrendingDownIcon} variant="negative" />
        <MetricCard title="Saldo Final" value={formatCurrency(reportData.saldoFinal)} icon={Wallet} variant={reportData.saldoFinal >= 0 ? "positive" : "negative"} />
        <MetricCard title="Transações" value={reportData.transactionCount.toString()} icon={Activity} />
      </div>

      {/* Gráficos em Abas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview" className="gap-2"><BarChart3 className="h-4 w-4" />Visão Geral</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><PieChartIcon className="h-4 w-4" />Categorias</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card><CardHeader><CardTitle>Evolução Mensal</CardTitle><CardDescription>Receitas vs. Despesas</CardDescription></CardHeader><CardContent className="h-[400px] p-6"><ResponsiveContainer width="100%" height="100%"><BarChart data={reportData.balanceEvolution}><XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} /><YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={value => `${(Number(value) / 1000).toFixed(0)}k`} /><Tooltip content={<CustomTooltip />} /><Legend /><Bar dataKey="receitas" name="Receitas" fill="#22c55e" /><Bar dataKey="despesas" name="Despesas" fill="#ef4444" /></BarChart></ResponsiveContainer></CardContent></Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
              <CardContent className="h-[400px] p-6"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData.expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}>{reportData.expensesByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer></CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Receitas por Categoria</CardTitle></CardHeader>
              <CardContent className="h-[400px] p-6">{reportData.incomeByCategory.length > 0 ? (<ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={reportData.incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}>{reportData.incomeByCategory.map((entry, index) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}</Pie><Tooltip content={<CustomTooltip />} /></PieChart></ResponsiveContainer>) : (<div className="flex items-center justify-center h-full text-muted-foreground"><div className="text-center space-y-3"><DollarSign className="h-16 w-16 mx-auto opacity-50" /><p>Nenhuma receita encontrada</p></div></div>)}</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}