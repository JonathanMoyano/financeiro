"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingDown,
  TrendingUp,
  PiggyBank,
  Plus,
  Eye,
  EyeOff,
  Calendar,
  Target,
  Wallet,
  CreditCard,
  RefreshCw,
  AlertCircle,
  Loader2,
  BarChart3,
  ArrowRight,
  Activity,
  Clock,
  Filter,
  X,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface FinanceData {
  receitas: number;
  despesas: number;
  poupanca: number;
  metaMensal: number;
  totalMetas: number;
  metasAtingidas: number;
}

interface RecentTransaction {
  id: string;
  tipo: "receita" | "despesa" | "poupanca";
  descricao: string;
  valor: number;
  data: string;
  categoria: string;
  created_at: string;
}

interface MonthlyData {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface TrendData {
  percentage: number;
  absolute: number;
  isPositive: boolean;
  insufficientData: boolean;
}

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [financeData, setFinanceData] = useState<FinanceData>({
    receitas: 0,
    despesas: 0,
    poupanca: 0,
    metaMensal: 0,
    totalMetas: 0,
    metasAtingidas: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<RecentTransaction[]>([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [trendData, setTrendData] = useState<TrendData>({
    percentage: 0,
    absolute: 0,
    isPositive: false,
    insufficientData: true,
  });
  const [showPoupancaModal, setShowPoupancaModal] = useState(false);
  const [poupancaForm, setPoupancaForm] = useState({
    valor: "",
    tipo: "deposito" as "deposito" | "saque",
    descricao: "",
  });
  const [loadingStates, setLoadingStates] = useState({
    finance: false,
    transactions: false,
    monthly: false,
  });

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    if (mounted && user && !authLoading) {
      loadAllData();
    }
  }, [user, authLoading, mounted, selectedPeriod]);

  useEffect(() => {
    if (monthlyData?.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];

      if (currentMonth && previousMonth) {
        const saldoAtual = currentMonth.saldo;
        const saldoAnterior = previousMonth.saldo;
        const difference = saldoAtual - saldoAnterior;
        const percentage = saldoAnterior !== 0 ? (difference / Math.abs(saldoAnterior)) * 100 : saldoAtual !== 0 ? 100 : 0;

        setTrendData({
          absolute: difference,
          percentage: percentage,
          isPositive: difference >= 0,
          insufficientData: false,
        });
        return;
      }
    }

    setTrendData({
      percentage: 0,
      absolute: 0,
      isPositive: false,
      insufficientData: true,
    });
  }, [monthlyData]);

  const forceRefresh = async () => {
    setRecentTransactions([]);
    setFinanceData({
      receitas: 0,
      despesas: 0,
      poupanca: 0,
      metaMensal: 0,
      totalMetas: 0,
      metasAtingidas: 0,
    });
    setMonthlyData([]);

    if (user) {
      await loadAllData();
    }
  };

  const loadAllData = async () => {
    if (!user) return;
    try {
      await Promise.all([
        loadFinanceData(),
        loadRecentTransactions(),
        loadMonthlyData(),
      ]);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    }
  };

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0);
        break;
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const loadFinanceData = async () => {
    if (!user) return;
    setLoadingStates((prev) => ({ ...prev, finance: true }));
    
    try {
      const { start, end } = getDateRange();

      // CARREGAR DESPESAS
      let totalDespesas = 0;
      const { data: despesasData, error: despesasError } = await supabase
        .from("despesas")
        .select("valor")
        .eq("user_id", user.id)
        .gte("data", start)
        .lte("data", end);

      if (despesasError) {
        console.error("Erro ao buscar despesas:", despesasError);
      } else if (despesasData) {
        totalDespesas = despesasData.reduce((total, item) => {
          const valor = parseFloat(item.valor) || 0;
          return total + valor;
        }, 0);
      }

      // CARREGAR RECEITAS
      let totalReceitas = 0;
      const { data: receitasData, error: receitasError } = await supabase
        .from("receitas")
        .select("valor")
        .eq("user_id", user.id)
        .gte("data", start)
        .lte("data", end);

      if (receitasError) {
        console.error("Erro ao buscar receitas:", receitasError);
      } else if (receitasData) {
        totalReceitas = receitasData.reduce((total, item) => {
          const valor = parseFloat(item.valor) || 0;
          return total + valor;
        }, 0);
      }

      // CARREGAR POUPANÇA
      let totalPoupanca = 0;
      let totalMetas = 0;
      let metasAtingidas = 0;
      const { data: poupancaData, error: poupancaError } = await supabase
        .from("poupanca")
        .select("*")
        .eq("user_id", user.id);

      if (poupancaError) {
        console.error("Erro ao buscar poupança:", poupancaError);
      } else if (poupancaData) {
        totalPoupanca = poupancaData.reduce((total, item) => {
          const valorAtual = parseFloat(item.valor_atual || item.valor || 0);
          return total + valorAtual;
        }, 0);
        
        totalMetas = poupancaData.length;
        metasAtingidas = poupancaData.filter((item) => {
          const valorAtual = parseFloat(item.valor_atual || item.valor || 0);
          const valorObjetivo = parseFloat(item.valor_objetivo || item.meta || 0);
          return valorObjetivo > 0 && valorAtual >= valorObjetivo;
        }).length;
      }

      setFinanceData({
        receitas: totalReceitas,
        despesas: totalDespesas,
        poupanca: totalPoupanca,
        metaMensal: 0,
        totalMetas,
        metasAtingidas,
      });

    } catch (error) {
      console.error("Erro geral ao carregar dados financeiros:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, finance: false }));
    }
  };

  const loadRecentTransactions = async () => {
    if (!user) return;
    setLoadingStates((prev) => ({ ...prev, transactions: true }));
    
    try {
      const transactions: RecentTransaction[] = [];

      // Buscar despesas
      const { data: despesasData } = await supabase
        .from("despesas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (despesasData) {
        despesasData.forEach((item) => {
          transactions.push({
            id: item.id,
            tipo: "despesa",
            descricao: item.descricao || "Sem descrição",
            valor: parseFloat(item.valor) || 0,
            data: item.data || new Date().toISOString().split("T")[0],
            categoria: item.categoria || "Sem categoria",
            created_at: item.created_at || new Date().toISOString(),
          });
        });
      }

      // Buscar receitas
      const { data: receitasData } = await supabase
        .from("receitas")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (receitasData) {
        receitasData.forEach((item) => {
          transactions.push({
            id: item.id,
            tipo: "receita",
            descricao: item.descricao || "Sem descrição",
            valor: parseFloat(item.valor) || 0,
            data: item.data || new Date().toISOString().split("T")[0],
            categoria: item.categoria || "Receita",
            created_at: item.created_at || new Date().toISOString(),
          });
        });
      }

      // Buscar poupança
      const { data: poupancaData } = await supabase
        .from("poupanca")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(3);

      if (poupancaData) {
        poupancaData.forEach((item) => {
          transactions.push({
            id: item.id,
            tipo: "poupanca",
            descricao: item.descricao || "Meta de poupança",
            valor: parseFloat(item.valor_atual || item.valor || 0),
            data: item.data_objetivo || new Date().toISOString().split("T")[0],
            categoria: item.categoria || "Poupança",
            created_at: item.created_at || new Date().toISOString(),
          });
        });
      }

      // Ordenar por data de criação e limitar
      transactions.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setRecentTransactions(transactions.slice(0, 8));

    } catch (error) {
      console.error("Erro ao carregar transações:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, transactions: false }));
    }
  };

  const loadMonthlyData = async () => {
    if (!user) return;
    setLoadingStates((prev) => ({ ...prev, monthly: true }));
    
    try {
      const monthlyResults: MonthlyData[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split("T")[0];
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split("T")[0];

        let despesasMes = 0;
        let receitasMes = 0;

        // Despesas do mês
        const { data: despesasData } = await supabase
          .from("despesas")
          .select("valor")
          .eq("user_id", user.id)
          .gte("data", startOfMonth)
          .lte("data", endOfMonth);

        if (despesasData) {
          despesasMes = despesasData.reduce((total, item) => total + (parseFloat(item.valor) || 0), 0);
        }

        // Receitas do mês
        const { data: receitasData } = await supabase
          .from("receitas")
          .select("valor")
          .eq("user_id", user.id)
          .gte("data", startOfMonth)
          .lte("data", endOfMonth);

        if (receitasData) {
          receitasMes = receitasData.reduce((total, item) => total + (parseFloat(item.valor) || 0), 0);
        }

        monthlyResults.push({
          mes: date.toLocaleDateString("pt-BR", { month: "short" }),
          receitas: receitasMes,
          despesas: despesasMes,
          saldo: receitasMes - despesasMes,
        });
      }

      setMonthlyData(monthlyResults);
    } catch (error) {
      console.error("Erro ao carregar dados mensais:", error);
    } finally {
      setLoadingStates((prev) => ({ ...prev, monthly: false }));
    }
  };

  const handlePoupancaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      const valor = parseFloat(poupancaForm.valor);
      if (isNaN(valor) || valor <= 0) return;

      const { error } = await supabase.from("poupanca").insert({
        user_id: user.id,
        descricao: poupancaForm.descricao,
        valor_objetivo: valor,
        valor_atual: poupancaForm.tipo === "deposito" ? valor : 0,
        data_objetivo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        categoria: "Movimentação",
      });

      if (error) throw error;

      await loadAllData();
      setShowPoupancaModal(false);
      setPoupancaForm({ valor: "", tipo: "deposito", descricao: "" });
    } catch (error) {
      console.error("Erro ao salvar poupança:", error);
    }
  };

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    if (isNaN(value) || value === null || value === undefined) return "R$ 0,00";
    
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const saldo = financeData.receitas - financeData.despesas;
  const progressoMeta = financeData.metaMensal > 0 ? (saldo / financeData.metaMensal) * 100 : 0;
  const metasProgress = financeData.totalMetas > 0 ? (financeData.metasAtingidas / financeData.totalMetas) * 100 : 0;

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso negado</h3>
          <p className="text-gray-500 mb-4">Você precisa estar logado para acessar esta página.</p>
          <button
            onClick={() => router.push("/login")}
            className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Ir para Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground truncate">
              Olá, {user.user_metadata?.full_name || user.email?.split("@")[0]}!
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="current_month">Este mês</option>
                <option value="last_month">Mês anterior</option>
                <option value="last_3_months">3 meses</option>
                <option value="current_year">Ano atual</option>
              </select>
            </div>

            <button
              onClick={forceRefresh}
              className="p-3 rounded-lg bg-card hover:bg-accent border transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <button
              onClick={() => setShowValues(!showValues)}
              className="p-3 rounded-lg bg-card hover:bg-accent border transition-colors"
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              {showValues ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Atualizado agora</span>
        </div>
      </div>

      {/* Cards principais */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Saldo */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-3">
            <div className={`p-3 rounded-lg w-fit ${saldo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"}`}>
              <Wallet className={`h-6 w-6 ${saldo >= 0 ? "text-emerald-500" : "text-red-500"}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Saldo</p>
              <p className={`text-xl font-bold ${saldo >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Receitas */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-3">
            <div className="p-3 rounded-lg bg-emerald-500/10 w-fit">
              <TrendingUp className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Receitas</p>
              <p className="text-xl font-bold text-emerald-500">
                {formatCurrency(financeData.receitas)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-3">
            <div className="p-3 rounded-lg bg-red-500/10 w-fit">
              <TrendingDown className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Despesas</p>
              <p className="text-xl font-bold text-red-500">
                {formatCurrency(financeData.despesas)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Poupança */}
        <div className="bg-card rounded-xl p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-3">
            <div className="p-3 rounded-lg bg-blue-500/10 w-fit">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Poupança</p>
              <p className="text-xl font-bold text-blue-500">
                {formatCurrency(financeData.poupanca)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Meta Mensal */}
        {financeData.metaMensal > 0 && (
          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">Meta Mensal</h3>
              </div>
              <span className="text-sm text-muted-foreground">{Math.round(progressoMeta)}%</span>
            </div>
            <div className="space-y-3">
              <div className="w-full bg-muted rounded-full h-3">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    progressoMeta >= 100 ? "bg-emerald-500" : progressoMeta >= 50 ? "bg-primary" : "bg-yellow-500"
                  }`}
                  style={{ width: `${Math.min(progressoMeta, 100)}%` }}
                />
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{formatCurrency(saldo)}</span>
                <span className="text-muted-foreground">{formatCurrency(financeData.metaMensal)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Metas de Poupança */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PiggyBank className="h-5 w-5 text-blue-500" />
              </div>
              <h3 className="text-lg font-semibold">Metas</h3>
            </div>
            <span className="text-sm text-muted-foreground">
              {financeData.metasAtingidas}/{financeData.totalMetas}
            </span>
          </div>
          <div className="space-y-3">
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="h-3 rounded-full transition-all duration-300 bg-blue-500"
                style={{ width: `${Math.min(metasProgress, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">{formatPercentage(metasProgress)} atingidas</span>
              <button
                onClick={() => setShowPoupancaModal(true)}
                className="text-primary hover:text-primary/80 font-medium flex items-center gap-1"
              >
                <Plus className="h-3 w-3" />
                Nova
              </button>
            </div>
          </div>
        </div>

        {/* Tendência */}
        <div className="bg-card rounded-xl p-6 border md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <h3 className="text-lg font-semibold">Tendência</h3>
            </div>
            {!trendData.insufficientData && (
              <span className={`text-sm font-medium ${trendData.isPositive ? "text-emerald-600" : "text-red-600"}`}>
                {trendData.isPositive ? "+" : ""}{trendData.percentage.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="space-y-2">
            {trendData.insufficientData ? (
              <p className="text-sm text-muted-foreground">Dados insuficientes</p>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">vs mês anterior</p>
                <div className="flex items-center gap-2 text-sm">
                  {trendData.isPositive ? (
                    <TrendingUp className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-500" />
                  )}
                  <span className={`font-medium ${trendData.isPositive ? "text-emerald-600" : "text-red-600"}`}>
                    {formatCurrency(trendData.absolute)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Evolução Mensal */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <h3 className="text-lg font-semibold">Evolução Mensal</h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-emerald-500 rounded-full" />
                <span>Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span>Despesas</span>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loadingStates.monthly ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : monthlyData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-end justify-between h-40 gap-2">
                {monthlyData.map((data, index) => {
                  const maxValue = Math.max(...monthlyData.map(d => Math.max(d.receitas, d.despesas)));
                  const receitasHeight = maxValue > 0 ? (data.receitas / maxValue) * 120 : 0;
                  const despesasHeight = maxValue > 0 ? (data.despesas / maxValue) * 120 : 0;
                  
                  return (
                    <div key={index} className="flex flex-col items-center gap-1 flex-1">
                      <div className="flex flex-col items-center gap-1 w-full max-w-12">
                        <div
                          className="w-full bg-emerald-500 rounded-t opacity-80"
                          style={{ height: `${Math.max(receitasHeight, 4)}px` }}
                          title={`Receitas: ${formatCurrency(data.receitas)}`}
                        />
                        <div
                          className="w-full bg-red-500 rounded-b opacity-80"
                          style={{ height: `${Math.max(despesasHeight, 4)}px` }}
                          title={`Despesas: ${formatCurrency(data.despesas)}`}
                        />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">{data.mes}</span>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Média Receitas</p>
                  <p className="text-sm font-semibold text-emerald-600">
                    {formatCurrency(monthlyData.reduce((acc, data) => acc + data.receitas, 0) / monthlyData.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Média Despesas</p>
                  <p className="text-sm font-semibold text-red-600">
                    {formatCurrency(monthlyData.reduce((acc, data) => acc + data.despesas, 0) / monthlyData.length)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Saldo Médio</p>
                  <p className="text-sm font-semibold text-blue-600">
                    {formatCurrency(monthlyData.reduce((acc, data) => acc + data.saldo, 0) / monthlyData.length)}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <BarChart3 className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-base text-muted-foreground">Sem dados suficientes</p>
              <p className="text-sm text-muted-foreground/70">Adicione transações para ver a evolução</p>
            </div>
          )}
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <button
          onClick={() => router.push("/receitas")}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Plus className="h-6 w-6 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Receita</h3>
              <p className="text-sm text-muted-foreground">Adicionar</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/despesas")}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-red-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <CreditCard className="h-6 w-6 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Despesa</h3>
              <p className="text-sm text-muted-foreground">Registrar</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/poupanca")}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <PiggyBank className="h-6 w-6 text-blue-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Poupança</h3>
              <p className="text-sm text-muted-foreground">Metas</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/relatorios")}
          className="bg-card rounded-xl p-6 border hover:shadow-md hover:border-purple-200 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <BarChart3 className="h-6 w-6 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Relatórios</h3>
              <p className="text-sm text-muted-foreground">Análises</p>
            </div>
          </div>
        </button>
      </div>

      {/* Transações recentes */}
      <div className="bg-card rounded-xl border">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Transações Recentes</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={loadRecentTransactions}
                className="text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Atualizar
              </button>
              <button
                onClick={() => router.push("/despesas")}
                className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6">
          {loadingStates.transactions ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-3 border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-3"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div
                      className={`p-2 rounded-lg ${
                        transaction.tipo === "receita"
                          ? "bg-emerald-500/10"
                          : transaction.tipo === "despesa"
                          ? "bg-red-500/10"
                          : "bg-blue-500/10"
                      }`}
                    >
                      {transaction.tipo === "receita" ? (
                        <TrendingUp className="h-4 w-4 text-emerald-500" />
                      ) : transaction.tipo === "despesa" ? (
                        <TrendingDown className="h-4 w-4 text-red-500" />
                      ) : (
                        <PiggyBank className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{transaction.descricao}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {transaction.categoria} • {new Date(transaction.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-sm font-semibold ${
                        transaction.tipo === "receita" || transaction.tipo === "poupanca"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.tipo === "despesa" ? "-" : "+"}
                      {formatCurrency(transaction.valor)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-base text-muted-foreground mb-2">Nenhuma transação encontrada</p>
              <p className="text-sm text-muted-foreground/70 mb-4">
                Comece adicionando suas primeiras transações!
              </p>
              <button
                onClick={() => router.push("/despesas")}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Adicionar Transação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal Poupança */}
      {showPoupancaModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-20 mx-auto border w-full max-w-md shadow-lg rounded-xl bg-card">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-medium">Nova Meta de Poupança</h3>
              <button
                onClick={() => setShowPoupancaModal(false)}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handlePoupancaSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Tipo</label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  value={poupancaForm.tipo}
                  onChange={(e) =>
                    setPoupancaForm({
                      ...poupancaForm,
                      tipo: e.target.value as "deposito" | "saque",
                    })
                  }
                >
                  <option value="deposito">Nova Meta</option>
                  <option value="saque">Contribuição</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  value={poupancaForm.valor}
                  onChange={(e) => setPoupancaForm({ ...poupancaForm, valor: e.target.value })}
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Descrição</label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  value={poupancaForm.descricao}
                  onChange={(e) => setPoupancaForm({ ...poupancaForm, descricao: e.target.value })}
                  placeholder="Ex: Reserva de emergência"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPoupancaModal(false)}
                  className="px-4 py-2 border border-input rounded-md text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}