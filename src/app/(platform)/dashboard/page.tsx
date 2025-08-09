import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  DollarSign, 
  TrendingDown, 
  TrendingUp, 
  User, 
  Plus,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  PieChart,
  BarChart3,
  Sparkles
} from "lucide-react";
import { ExpensesChart } from "@/components/features/dashboard/expenses-chart";
import { AIAssistant } from "@/components/features/dashboard/ai-assistant";
import { Database } from "@/lib/database.types";
import Link from "next/link";

// Força a página a ser sempre dinâmica
export const dynamic = 'force-dynamic';

// Função melhorada para formatar valores monetários
const formatCurrency = (amount: number | null) => {
  if (amount === null || amount === 0) return "R$ 0,00";
  return new Intl.NumberFormat('pt-BR', { 
    style: 'currency', 
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

// Função para formatar percentual
const formatPercentage = (current: number, previous: number) => {
  if (previous === 0) return { value: 0, isPositive: current >= 0 };
  const percentage = ((current - previous) / previous) * 100;
  return { 
    value: Math.abs(percentage), 
    isPositive: percentage >= 0 
  };
};

// Função para obter saudação baseada no horário
const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
};

// Função para extrair primeiro nome
const getFirstName = (email: string, fullName?: string) => {
  if (fullName) {
    return fullName.split(' ')[0];
  }
  return email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
};

// Tipo melhorado para transações
type TransactionWithCategory = {
  amount: number | null;
  type: "income" | "expense" | null;
  created_at: string;
  categories: {
    name: string | null;
  } | null;
};

// Função para buscar dados do dashboard com mais detalhes
async function getDashboardData() {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      userName: "Visitante",
      userEmail: "",
      totalIncome: 0,
      totalExpenses: 0,
      balance: 0,
      chartData: [],
      recentTransactions: [],
      monthlyComparison: { income: { value: 0, isPositive: true }, expenses: { value: 0, isPositive: true } },
      topCategories: []
    };
  }

  // Busca perfil do usuário para obter o nome completo
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, avatar_url')
    .eq('id', user.id)
    .single();

  // Data atual e mês anterior para comparação
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

  // Busca transações do mês atual
  const { data: currentMonthData, error } = await supabase
    .from('transactions')
    .select('amount, type, created_at, categories(name)')
    .eq('user_id', user.id)
    .gte('created_at', new Date(currentYear, currentMonth, 1).toISOString())
    .lt('created_at', new Date(currentYear, currentMonth + 1, 1).toISOString())
    .order('created_at', { ascending: false });

  // Busca transações do mês anterior para comparação
  const { data: lastMonthData } = await supabase
    .from('transactions')
    .select('amount, type')
    .eq('user_id', user.id)
    .gte('created_at', new Date(lastMonthYear, lastMonth, 1).toISOString())
    .lt('created_at', new Date(lastMonthYear, lastMonth + 1, 1).toISOString());

  if (error) {
    console.error("Erro ao buscar dados do dashboard:", error);
    return { 
      userName: getFirstName(user.email || "", profile?.full_name || undefined), 
      userEmail: user.email,
      totalIncome: 0, 
      totalExpenses: 0, 
      balance: 0, 
      chartData: [],
      recentTransactions: [],
      monthlyComparison: { income: { value: 0, isPositive: true }, expenses: { value: 0, isPositive: true } },
      topCategories: []
    };
  }

  // Processa dados do mês atual
  let totalIncome = 0;
  let totalExpenses = 0;
  const expensesByCategory: { [key: string]: number } = {};

  if (currentMonthData) {
    (currentMonthData as unknown as TransactionWithCategory[]).forEach(t => {
      const amount = t.amount ?? 0;
      if (t.type === 'income') {
        totalIncome += amount;
      } else if (t.type === 'expense') {
        totalExpenses += amount;
        const categoryName = t.categories?.name ?? 'Outras';
        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + amount;
      }
    });
  }

  // Processa dados do mês anterior
  let lastMonthIncome = 0;
  let lastMonthExpenses = 0;
  
  if (lastMonthData) {
    lastMonthData.forEach(t => {
      const amount = t.amount ?? 0;
      if (t.type === 'income') {
        lastMonthIncome += amount;
      } else if (t.type === 'expense') {
        lastMonthExpenses += amount;
      }
    });
  }

  // Prepara dados para o gráfico
  const chartData = Object.entries(expensesByCategory)
    .map(([name, total]) => ({ name, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 6); // Top 6 categorias

  // Top 3 categorias de despesas
  const topCategories = Object.entries(expensesByCategory)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amount]) => ({ name, amount }));

  // Transações recentes (últimas 5)
  const recentTransactions = (currentMonthData as unknown as TransactionWithCategory[])
    ?.slice(0, 5) || [];

  return {
    userName: getFirstName(user.email || "", profile?.full_name || undefined),
    userEmail: user.email,
    totalIncome,
    totalExpenses,
    balance: totalIncome - totalExpenses,
    chartData,
    recentTransactions,
    monthlyComparison: {
      income: formatPercentage(totalIncome, lastMonthIncome),
      expenses: formatPercentage(totalExpenses, lastMonthExpenses)
    },
    topCategories
  };
}

// Componente para cartão de métricas com comparação
function MetricCard({ 
  title, 
  value, 
  description, 
  icon: Icon, 
  trend, 
  variant = "default" 
}: {
  title: string;
  value: string;
  description: string;
  icon: any;
  trend?: { value: number; isPositive: boolean };
  variant?: "default" | "income" | "expense";
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case "income":
        return "text-emerald-600 bg-emerald-50 border-emerald-200";
      case "expense":
        return "text-red-600 bg-red-50 border-red-200";
      default:
        return "text-blue-600 bg-blue-50 border-blue-200";
    }
  };

  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-md">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={`p-2 rounded-lg ${getVariantClasses()}`}>
          <Icon className="h-4 w-4" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline gap-2 flex-wrap">
          <div className="text-xl sm:text-2xl font-bold">{value}</div>
          {trend && trend.value > 0 && (
            <div className={`flex items-center text-sm ${
              trend.isPositive ? 'text-emerald-600' : 'text-red-600'
            }`}>
              {trend.isPositive ? (
                <ArrowUpRight className="h-3 w-3 mr-1" />
              ) : (
                <ArrowDownRight className="h-3 w-3 mr-1" />
              )}
              {trend.value.toFixed(1)}%
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Componente para transações recentes
function RecentTransactions({ transactions }: { transactions: TransactionWithCategory[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">Transações Recentes</CardTitle>
        <Button variant="outline" size="sm" asChild>
          <Link href="/despesas">
            Ver todas
            <ArrowUpRight className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {transactions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            Nenhuma transação encontrada
          </p>
        ) : (
          transactions.map((transaction, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className={`p-2 rounded-full flex-shrink-0 ${
                  transaction.type === 'income' 
                    ? 'bg-emerald-100 text-emerald-600' 
                    : 'bg-red-100 text-red-600'
                }`}>
                  {transaction.type === 'income' ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">
                    {transaction.categories?.name || 'Sem categoria'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(transaction.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
              <div className={`font-semibold text-sm sm:text-base flex-shrink-0 ${
                transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'
              }`}>
                {transaction.type === 'income' ? '+' : '-'}
                {formatCurrency(transaction.amount)}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

// Componente para ações rápidas
function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Ações Rápidas</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <Button asChild className="h-auto flex-col py-4 text-xs sm:text-sm">
          <Link href="/despesas?action=add-income">
            <TrendingUp className="h-4 w-4 mb-2" />
            <span>Adicionar Receita</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto flex-col py-4 text-xs sm:text-sm">
          <Link href="/despesas?action=add-expense">
            <TrendingDown className="h-4 w-4 mb-2" />
            <span>Adicionar Despesa</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto flex-col py-4 text-xs sm:text-sm">
          <Link href="/relatorios">
            <BarChart3 className="h-4 w-4 mb-2" />
            <span>Ver Relatórios</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="h-auto flex-col py-4 text-xs sm:text-sm">
          <Link href="/configuracoes">
            <Target className="h-4 w-4 mb-2" />
            <span>Definir Metas</span>
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

// Componente principal da página do Dashboard
export default async function DashboardPage() {
  const { 
    userName, 
    totalIncome, 
    totalExpenses, 
    balance, 
    chartData,
    recentTransactions,
    monthlyComparison,
    topCategories
  } = await getDashboardData();

  const greeting = getGreeting();
  const currentDate = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="space-y-4 sm:space-y-6 p-2 sm:p-0">
      {/* Header com saudação personalizada */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {greeting}, {userName}! 
          </h1>
          <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />
        </div>
        <div className="flex items-center gap-2 sm:gap-4 text-muted-foreground flex-wrap">
          <p className="text-sm sm:text-base">{currentDate}</p>
          <Badge variant="secondary" className="text-xs">
            <Calendar className="h-3 w-3 mr-1" />
            Mês atual
          </Badge>
        </div>
      </div>

      {/* Cartões de métricas principais */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Receitas Totais"
          value={formatCurrency(totalIncome)}
          description="Total de entradas este mês"
          icon={TrendingUp}
          trend={monthlyComparison.income}
          variant="income"
        />
        <MetricCard
          title="Despesas Totais"
          value={formatCurrency(totalExpenses)}
          description="Total de saídas este mês"
          icon={TrendingDown}
          trend={monthlyComparison.expenses}
          variant="expense"
        />
        <MetricCard
          title="Saldo Atual"
          value={formatCurrency(balance)}
          description="Diferença entre receitas e despesas"
          icon={DollarSign}
          variant="default"
        />
      </div>

      {/* Grid principal com gráficos e widgets */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Gráfico de despesas - ocupa 2 colunas */}
        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
          <Card>
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between space-y-2 sm:space-y-0">
              <div>
                <CardTitle className="text-lg sm:text-xl font-semibold">
                  Análise por Categoria
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Distribuição das suas despesas
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/relatorios">
                  <PieChart className="h-4 w-4 mr-2" />
                  Detalhes
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <ExpensesChart data={chartData} />
            </CardContent>
          </Card>

          {/* Transações recentes */}
          <RecentTransactions transactions={recentTransactions} />
        </div>

        {/* Sidebar com widgets */}
        <div className="space-y-4 sm:space-y-6">
          {/* AI Assistant */}
          <AIAssistant />
          
          {/* Ações rápidas */}
          <QuickActions />

          {/* Top categorias */}
          {topCategories.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg font-semibold">
                  Maiores Gastos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {topCategories.map((category, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                      <span className="text-sm font-medium truncate">{category.name}</span>
                    </div>
                    <span className="text-sm font-semibold text-red-600 flex-shrink-0">
                      {formatCurrency(category.amount)}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}