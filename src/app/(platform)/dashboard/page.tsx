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
  CheckCircle,
  Loader2,
  BarChart3,
  ArrowRight,
  DollarSign,
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

interface CategoryData {
  categoria: string;
  valor: number;
  percentual: number;
  cor: string;
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
  const [recentTransactions, setRecentTransactions] = useState<
    RecentTransaction[]
  >([]);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loadingStates, setLoadingStates] = useState({
    finance: false,
    transactions: false,
    monthly: false,
    categories: false,
  });

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  const categoryColors = [
    "#10b981",
    "#3b82f6",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
    "#84cc16",
    "#f97316",
  ];

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !authLoading && !user) {
      console.log("❌ Usuário não autenticado, redirecionando...");
      router.push("/login");
    }
  }, [user, authLoading, router, mounted]);

  useEffect(() => {
    if (mounted && user && !authLoading) {
      loadAllData();
    }
  }, [user, authLoading, mounted, selectedPeriod]);

  useEffect(() => {
    if (monthlyData && monthlyData.length >= 2) {
      const currentMonth = monthlyData[monthlyData.length - 1];
      const previousMonth = monthlyData[monthlyData.length - 2];

      if (currentMonth && previousMonth) {
        const saldoAtual = currentMonth.saldo;
        const saldoAnterior = previousMonth.saldo;
        const difference = saldoAtual - saldoAnterior;

        const percentage =
          saldoAnterior !== 0
            ? (difference / Math.abs(saldoAnterior)) * 100
            : saldoAtual !== 0
            ? 100
            : 0;

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
    setCategoryData([]);

    if (user) {
      await loadAllData();
    }
  };

  const loadAllData = async () => {
    if (!user) return;
    try {
      setError(null);
      console.log("📊 Carregando todos os dados...");
      await Promise.all([
        loadFinanceData(),
        loadRecentTransactions(),
        loadMonthlyData(),
        loadCategoryData(),
      ]);
    } catch (error) {
      console.error("❌ Erro ao carregar dados:", error);
      setError("Erro ao carregar dados financeiros");
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
        startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1);
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
      console.log("💰 Carregando dados financeiros...");
      const { start, end } = getDateRange();
      console.log("📅 Período:", start, "até", end);

      let despesas = 0;
      try {
        const { data: despesasData, error: despesasError } = await supabase
          .from("despesas")
          .select("valor")
          .eq("user_id", user.id)
          .gte("data", start)
          .lte("data", end);
        if (despesasError) {
          console.error("Erro ao buscar despesas:", despesasError);
        } else {
          despesas =
            despesasData?.reduce(
              (sum, item) => sum + (Number(item.valor) || 0),
              0
            ) || 0;
        }
      } catch (error) {
        console.error("Erro ao processar despesas:", error);
        despesas = 0;
      }

      let receitas = 0;
      try {
        const { data: receitasData, error: receitasError } = await supabase
          .from("receitas")
          .select("valor")
          .eq("user_id", user.id)
          .gte("data", start)
          .lte("data", end);
        if (receitasError) {
          console.error("Erro ao buscar receitas:", receitasError);
        } else {
          receitas =
            receitasData?.reduce(
              (sum, item) => sum + (Number(item.valor) || 0),
              0
            ) || 0;
        }
      } catch (error) {
        console.error("Erro ao processar receitas:", error);
        receitas = 0;
      }

      let poupanca = 0;
      let totalMetas = 0;
      let metasAtingidas = 0;
      try {
        const { data: poupancaData, error: poupancaError } = await supabase
          .from("poupanca")
          .select("*")
          .eq("user_id", user.id);
        if (poupancaError) {
          console.error(
            "Erro ao buscar poupanças:",
            poupancaError.message || poupancaError
          );
        } else if (poupancaData && poupancaData.length > 0) {
          poupanca = poupancaData.reduce((sum, item) => {
            const valorAtual =
              item.valor_atual || item.valor || item.valor_economizado || 0;
            return sum + (Number(valorAtual) || 0);
          }, 0);
          totalMetas = poupancaData.length;
          metasAtingidas = poupancaData.filter((item) => {
            const valorAtual = Number(
              item.valor_atual || item.valor || item.valor_economizado || 0
            );
            const valorObjetivo = Number(
              item.valor_objetivo ||
                item.objetivo ||
                item.meta ||
                item.valor_meta ||
                0
            );
            return valorObjetivo > 0 && valorAtual >= valorObjetivo;
          }).length;
        }
      } catch (error) {
        console.error("❌ Erro geral ao processar poupança:", error);
      }

      setFinanceData({
        receitas: Number(receitas) || 0,
        despesas: Number(despesas) || 0,
        poupanca: Number(poupanca) || 0,
        metaMensal: 0,
        totalMetas,
        metasAtingidas,
      });

      console.log("✅ Dados financeiros carregados:", {
        receitas,
        despesas,
        poupanca,
        totalMetas,
        metasAtingidas,
      });
    } catch (error) {
      console.error("❌ Erro geral ao carregar dados financeiros:", error);
      setFinanceData({
        receitas: 0,
        despesas: 0,
        poupanca: 0,
        metaMensal: 0,
        totalMetas: 0,
        metasAtingidas: 0,
      });
    } finally {
      setLoadingStates((prev) => ({ ...prev, finance: false }));
    }
  };

  const loadRecentTransactions = async () => {
    if (!user) return;
    setLoadingStates((prev) => ({ ...prev, transactions: true }));
    try {
      console.log("📋 Carregando transações recentes...");
      setRecentTransactions([]);
      const transactions: RecentTransaction[] = [];

      try {
        const { data: despesasData, error: despesasError } = await supabase
          .from("despesas")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(8);
        if (!despesasError && despesasData) {
          despesasData.forEach((despesa) => {
            if (despesa && despesa.id) {
              transactions.push({
                id: despesa.id,
                tipo: "despesa",
                descricao: despesa.descricao || "Sem descrição",
                valor: Number(despesa.valor) || 0,
                data: despesa.data || new Date().toISOString().split("T")[0],
                categoria: despesa.categoria || "Sem categoria",
                created_at: despesa.created_at || new Date().toISOString(),
              });
            }
          });
        }
      } catch (error) {
        console.error("Erro ao buscar despesas:", error);
      }

      try {
        const { data: receitasData, error: receitasError } = await supabase
          .from("receitas")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (!receitasError && receitasData) {
          receitasData.forEach((receita) => {
            if (receita && receita.id) {
              transactions.push({
                id: receita.id,
                tipo: "receita",
                descricao: receita.descricao || "Sem descrição",
                valor: Number(receita.valor) || 0,
                data: receita.data || new Date().toISOString().split("T")[0],
                categoria: receita.categoria || "Receita",
                created_at: receita.created_at || new Date().toISOString(),
              });
            }
          });
        }
      } catch (error) {
        console.error("Erro ao buscar receitas:", error);
      }

      try {
        const { data: poupancaData, error: poupancaError } = await supabase
          .from("poupanca")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);
        if (!poupancaError && poupancaData) {
          poupancaData.forEach((poupanca) => {
            if (poupanca && poupanca.id) {
              transactions.push({
                id: poupanca.id,
                tipo: "poupanca",
                descricao: poupanca.descricao || "Meta de poupança",
                valor: Number(poupanca.valor_atual || poupanca.valor || 0),
                data:
                  poupanca.data_objetivo ||
                  new Date().toISOString().split("T")[0],
                categoria: poupanca.categoria || "Poupança",
                created_at: poupanca.created_at || new Date().toISOString(),
              });
            }
          });
        }
      } catch (error) {
        console.error("Erro ao buscar poupanças para transações:", error);
      }

      if (transactions.length > 0) {
        transactions.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentTransactions(transactions.slice(0, 10));
      } else {
        setRecentTransactions([]);
      }
      console.log("✅ Transações carregadas:", transactions.length);
    } catch (error) {
      console.error("❌ Erro ao carregar transações:", error);
      setRecentTransactions([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, transactions: false }));
    }
  };

  const loadMonthlyData = async () => {
    if (!user) return;
    setLoadingStates((prev) => ({ ...prev, monthly: true }));
    try {
      console.log("📊 Carregando dados mensais...");
      const monthlyResults: MonthlyData[] = [];
      const now = new Date();

      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
          .toISOString()
          .split("T")[0];
        const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0)
          .toISOString()
          .split("T")[0];

        let despesasMes = 0;
        let receitasMes = 0;

        try {
          const { data: despesasData } = await supabase
            .from("despesas")
            .select("valor")
            .eq("user_id", user.id)
            .gte("data", startOfMonth)
            .lte("data", endOfMonth);
          despesasMes =
            despesasData?.reduce(
              (sum, item) => sum + (Number(item.valor) || 0),
              0
            ) || 0;

          const { data: receitasData } = await supabase
            .from("receitas")
            .select("valor")
            .eq("user_id", user.id)
            .gte("data", startOfMonth)
            .lte("data", endOfMonth);
          receitasMes =
            receitasData?.reduce(
              (sum, item) => sum + (Number(item.valor) || 0),
              0
            ) || 0;
        } catch (error) {
          console.error(
            `Erro ao buscar dados do mês ${date.getMonth() + 1}:`,
            error
          );
        }

        monthlyResults.push({
          mes: date.toLocaleDateString("pt-BR", { month: "short" }),
          receitas: receitasMes,
          despesas: despesasMes,
          saldo: receitasMes - despesasMes,
        });
      }
      setMonthlyData(monthlyResults);
      console.log(
        "✅ Dados mensais carregados:",
        monthlyResults.length,
        "meses"
      );
    } catch (error) {
      console.error("❌ Erro ao carregar dados mensais:", error);
      setMonthlyData([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, monthly: false }));
    }
  };

  const loadCategoryData = async () => {
    if (!user) return;
    setLoadingStates((prev) => ({ ...prev, categories: true }));
    try {
      console.log("🏷️ Carregando dados por categoria...");
      const { start, end } = getDateRange();
      const { data: despesasData, error } = await supabase
        .from("despesas")
        .select("categoria, valor")
        .eq("user_id", user.id)
        .gte("data", start)
        .lte("data", end);
      if (error) {
        console.error("Erro ao buscar dados por categoria:", error);
        setCategoryData([]);
        return;
      }

      const categoryTotals: { [key: string]: number } = {};
      let totalGeral = 0;
      despesasData?.forEach((item) => {
        const categoria = item.categoria || "Outros";
        const valor = Number(item.valor) || 0;
        categoryTotals[categoria] = (categoryTotals[categoria] || 0) + valor;
        totalGeral += valor;
      });

      const categoryArray = Object.entries(categoryTotals)
        .map(([categoria, valor], index) => ({
          categoria,
          valor,
          percentual: totalGeral > 0 ? (valor / totalGeral) * 100 : 0,
          cor: categoryColors[index % categoryColors.length],
        }))
        .sort((a, b) => b.valor - a.valor)
        .slice(0, 8);
      setCategoryData(categoryArray);
      console.log(
        "✅ Dados por categoria carregados:",
        categoryArray.length,
        "categorias"
      );
    } catch (error) {
      console.error("❌ Erro ao carregar dados por categoria:", error);
      setCategoryData([]);
    } finally {
      setLoadingStates((prev) => ({ ...prev, categories: false }));
    }
  };

  const handlePoupancaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      console.log("💾 Salvando movimentação de poupança...");
      const valor = parseFloat(poupancaForm.valor);
      if (isNaN(valor) || valor <= 0) {
        setError("Por favor, insira um valor válido.");
        return;
      }
      const { error } = await supabase.from("poupanca").insert({
        user_id: user.id,
        descricao: poupancaForm.descricao,
        valor_objetivo: valor,
        valor_atual: poupancaForm.tipo === "deposito" ? valor : 0,
        data_objetivo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0],
        categoria: "Movimentação",
      });
      if (error) throw error;
      await loadAllData();
      setShowPoupancaModal(false);
      setPoupancaForm({ valor: "", tipo: "deposito", descricao: "" });
      setSuccess("Movimentação de poupança salva com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("❌ Erro ao salvar poupança:", error);
      setError("Erro ao salvar movimentação. Tente novamente.");
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    if (!showValues) return "R$ ••••••";
    if (value === undefined || value === null || isNaN(value)) {
      return "R$ 0,00";
    }
    const numericValue = Number(value) || 0;
    return `${numericValue < 0 ? "-" : ""}R$ ${Math.abs(numericValue)
      .toFixed(2)
      .replace(".", ",")
      .replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const saldo = (financeData?.receitas || 0) - (financeData?.despesas || 0);
  const progressoMeta =
    (financeData?.metaMensal || 0) > 0
      ? (saldo / financeData.metaMensal) * 100
      : 0;
  const metasProgress =
    (financeData?.totalMetas || 0) > 0
      ? (financeData.metasAtingidas / financeData.totalMetas) * 100
      : 0;

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 md:h-12 md:w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-sm md:text-base text-muted-foreground">
            Carregando dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 md:h-16 md:w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Acesso negado
          </h3>
          <p className="text-gray-500 mb-4 text-sm md:text-base">
            Você precisa estar logado para acessar esta página.
          </p>
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
    <div className="space-y-4 md:space-y-6">
      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-red-800 font-medium text-sm md:text-base">
                Erro
              </h4>
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 text-xs md:text-sm underline mt-1"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 shrink-0" />
            <div>
              <h4 className="text-green-800 font-medium text-sm md:text-base">
                Sucesso
              </h4>
              <p className="text-green-700 text-xs md:text-sm">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Header minimalista */}
      <div className="flex flex-col space-y-3 md:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Dashboard
            </h1>
            <p className="text-sm md:text-base text-muted-foreground truncate">
              Olá, {user.user_metadata?.full_name || user.email?.split("@")[0]}!
            </p>
          </div>

          <div className="flex w-full sm:w-auto items-center justify-center gap-2 md:gap-3">
            <div className="flex items-center gap-1 md:gap-2">
              <Filter className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground hidden sm:block" />
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="rounded-md border border-input bg-background px-2 md:px-3 py-1.5 md:py-2 text-xs md:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="current_month">Este mês</option>
                <option value="last_month">Mês anterior</option>
                <option value="last_3_months">3 meses</option>
                <option value="current_year">Ano atual</option>
              </select>
            </div>

            <button
              onClick={forceRefresh}
              className="p-2 md:p-3 rounded-lg bg-card hover:bg-accent border transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="h-3 w-3 md:h-4 md:w-4" />
            </button>

            <button
              onClick={() => setShowValues(!showValues)}
              className="p-2 md:p-3 rounded-lg bg-card hover:bg-accent border transition-colors"
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              {showValues ? (
                <Eye className="h-3 w-3 md:h-4 md:w-4" />
              ) : (
                <EyeOff className="h-3 w-3 md:h-4 md:w-4" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center sm:justify-start gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Atualizado agora</span>
        </div>
      </div>

      {/* Cards principais responsivos */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        {/* Saldo */}
        <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-2 md:space-y-3">
            <div
              className={`p-2 md:p-3 rounded-lg w-fit ${
                saldo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
              }`}
            >
              <Wallet
                className={`h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 ${
                  saldo >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">Saldo</p>
              <p
                className={`text-sm md:text-lg lg:text-xl font-bold ${
                  saldo >= 0 ? "text-emerald-500" : "text-red-500"
                }`}
              >
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Receitas */}
        <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-2 md:space-y-3">
            <div className="p-2 md:p-3 rounded-lg bg-emerald-500/10 w-fit">
              <TrendingUp className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-emerald-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Receitas
              </p>
              <p className="text-sm md:text-lg lg:text-xl font-bold text-emerald-500">
                {formatCurrency(financeData?.receitas)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Despesas */}
        <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-2 md:space-y-3">
            <div className="p-2 md:p-3 rounded-lg bg-red-500/10 w-fit">
              <TrendingDown className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-red-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Despesas
              </p>
              <p className="text-sm md:text-lg lg:text-xl font-bold text-red-500">
                {formatCurrency(financeData?.despesas)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
            </div>
          )}
        </div>

        {/* Poupança */}
        <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md transition-all duration-200 relative">
          <div className="flex flex-col space-y-2 md:space-y-3">
            <div className="p-2 md:p-3 rounded-lg bg-blue-500/10 w-fit">
              <PiggyBank className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-500" />
            </div>
            <div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Poupança
              </p>
              <p className="text-sm md:text-lg lg:text-xl font-bold text-blue-500">
                {formatCurrency(financeData?.poupanca)}
              </p>
            </div>
          </div>
          {loadingStates.finance && (
            <div className="absolute inset-0 bg-card/50 flex items-center justify-center rounded-lg">
              <Loader2 className="h-3 w-3 md:h-4 md:w-4 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Cards de métricas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Meta Mensal (só aparece se a meta > 0) */}
        {(financeData?.metaMensal || 0) > 0 && (
          <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border">
            <div className="flex items-center justify-between mb-3 md:mb-4">
              <div className="flex items-center gap-2 md:gap-3">
                <div className="p-1.5 md:p-2 rounded-lg bg-primary/10">
                  <Target className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                </div>
                <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                  Meta Mensal
                </h3>
              </div>
              <span className="text-xs md:text-sm text-muted-foreground">
                {Math.round(progressoMeta)}%
              </span>
            </div>
            <div className="space-y-2 md:space-y-3">
              <div className="w-full bg-muted rounded-full h-2 md:h-3">
                <div
                  className={`h-2 md:h-3 rounded-full transition-all duration-300 ${
                    progressoMeta >= 100
                      ? "bg-emerald-500"
                      : progressoMeta >= 50
                      ? "bg-primary"
                      : "bg-yellow-500"
                  }`}
                  style={{ width: `${Math.min(progressoMeta, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-xs md:text-sm">
                <span className="text-muted-foreground">
                  {formatCurrency(saldo)}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(financeData?.metaMensal)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Metas de Poupança */}
        <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-blue-500/10">
                <PiggyBank className="h-4 w-4 md:h-5 md:w-5 text-blue-500" />
              </div>
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Metas
              </h3>
            </div>
            <span className="text-xs md:text-sm text-muted-foreground">
              {financeData?.metasAtingidas || 0}/{financeData?.totalMetas || 0}
            </span>
          </div>
          <div className="space-y-2 md:space-y-3">
            <div className="w-full bg-muted rounded-full h-2 md:h-3">
              <div
                className="h-2 md:h-3 rounded-full transition-all duration-300 bg-blue-500"
                style={{ width: `${Math.min(metasProgress, 100)}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center text-xs md:text-sm">
              <span className="text-muted-foreground">
                {formatPercentage(metasProgress)} atingidas
              </span>
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

        {/* Variação (Tendência) */}
        <div className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border md:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between mb-3 md:mb-4">
            <div className="flex items-center gap-2 md:gap-3">
              <div className="p-1.5 md:p-2 rounded-lg bg-purple-500/10">
                <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-500" />
              </div>
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Tendência
              </h3>
            </div>
            {!trendData.insufficientData && (
              <span
                className={`text-xs md:text-sm font-medium ${
                  trendData.isPositive ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {trendData.isPositive ? "+" : ""}
                {trendData.percentage.toFixed(1)}%
              </span>
            )}
          </div>
          <div className="space-y-1 md:space-y-2">
            {trendData.insufficientData ? (
              <p className="text-sm text-muted-foreground">
                Dados insuficientes
              </p>
            ) : (
              <>
                <p className="text-xs md:text-sm text-muted-foreground">
                  vs mês anterior
                </p>
                <div className="flex items-center gap-2 text-xs md:text-sm">
                  {trendData.isPositive ? (
                    <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
                  ) : (
                    <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                  )}
                  <span
                    className={`font-medium ${
                      trendData.isPositive ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {formatCurrency(trendData.absolute)}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Gráficos e categorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
        {/* Evolução Mensal */}
        <div className="lg:col-span-2 bg-card rounded-lg md:rounded-xl border">
          <div className="p-3 md:p-4 lg:p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Evolução Mensal
              </h3>
              <div className="flex items-center gap-3 md:gap-4 text-xs md:text-sm">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-emerald-500 rounded-full"></div>
                  <span>Receitas</span>
                </div>
                <div className="flex items-center gap-1.5 md:gap-2">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-red-500 rounded-full"></div>
                  <span>Despesas</span>
                </div>
              </div>
            </div>
          </div>
          <div className="p-3 md:p-4 lg:p-6">
            {loadingStates.monthly ? (
              <div className="flex items-center justify-center h-32 md:h-48 lg:h-64">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
              </div>
            ) : monthlyData.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                <div className="flex items-end justify-between h-24 md:h-32 gap-1 md:gap-2">
                  {monthlyData.map((data, index) => (
                    <div
                      key={index}
                      className="flex flex-col items-center gap-1 flex-1"
                    >
                      <div className="flex flex-col items-center gap-0.5 w-full">
                        <div
                          className="w-full bg-emerald-500 rounded-t opacity-70"
                          style={{
                            height: `${Math.max(
                              (data.receitas / 3000) * 50,
                              2
                            )}px`,
                          }}
                          title={`Receitas: ${formatCurrency(data.receitas)}`}
                        ></div>
                        <div
                          className="w-full bg-red-500 rounded-b opacity-70"
                          style={{
                            height: `${Math.max(
                              (data.despesas / 3000) * 50,
                              2
                            )}px`,
                          }}
                          title={`Despesas: ${formatCurrency(data.despesas)}`}
                        ></div>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {data.mes}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-3 gap-2 md:gap-4 pt-3 md:pt-4 border-t">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Média Receitas
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-emerald-600">
                      {formatCurrency(
                        monthlyData.reduce(
                          (acc, data) => acc + data.receitas,
                          0
                        ) / monthlyData.length
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">
                      Média Despesas
                    </p>
                    <p className="text-xs md:text-sm font-semibold text-red-600">
                      {formatCurrency(
                        monthlyData.reduce(
                          (acc, data) => acc + data.despesas,
                          0
                        ) / monthlyData.length
                      )}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground">Saldo Médio</p>
                    <p className="text-xs md:text-sm font-semibold text-blue-600">
                      {formatCurrency(
                        monthlyData.reduce((acc, data) => acc + data.saldo, 0) /
                          monthlyData.length
                      )}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <BarChart3 className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  Sem dados suficientes
                </p>
                <p className="text-xs md:text-sm text-muted-foreground/70">
                  Adicione transações para ver a evolução
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Categorias */}
        <div className="bg-card rounded-lg md:rounded-xl border">
          <div className="p-3 md:p-4 lg:p-6 border-b">
            <h3 className="text-sm md:text-base lg:text-lg font-semibold">
              Por Categoria
            </h3>
          </div>
          <div className="p-3 md:p-4 lg:p-6">
            {loadingStates.categories ? (
              <div className="flex items-center justify-center h-32 md:h-48">
                <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
              </div>
            ) : categoryData.length > 0 ? (
              <div className="space-y-3 md:space-y-4">
                <div className="relative w-20 h-20 md:w-24 md:h-24 lg:w-32 lg:h-32 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    {categoryData.map((category, index) => {
                      const totalPercentage = categoryData
                        .slice(0, index)
                        .reduce((acc, cat) => acc + cat.percentual, 0);
                      const radius = 35;
                      const circumference = 2 * Math.PI * radius;
                      const strokeDasharray = `${
                        (category.percentual / 100) * circumference
                      } ${circumference}`;
                      const strokeDashoffset = -(
                        (totalPercentage / 100) *
                        circumference
                      );

                      return (
                        <circle
                          key={index}
                          cx="50%"
                          cy="50%"
                          r={radius}
                          fill="transparent"
                          stroke={category.cor}
                          strokeWidth="12"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          className="transition-all duration-300"
                        />
                      );
                    })}
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-sm md:text-base lg:text-lg font-bold">
                        {categoryData.length}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        categorias
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 max-h-32 md:max-h-48 overflow-y-auto">
                  {categoryData.map((category, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                        <div
                          className="w-2 h-2 md:w-3 md:h-3 rounded-full shrink-0"
                          style={{ backgroundColor: category.cor }}
                        ></div>
                        <span className="text-xs md:text-sm font-medium truncate">
                          {category.categoria}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs md:text-sm font-semibold">
                          {formatCurrency(category.valor)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatPercentage(category.percentual)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 md:py-12">
                <DollarSign className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
                <p className="text-sm md:text-base text-muted-foreground">
                  Sem categorias
                </p>
                <p className="text-xs md:text-sm text-muted-foreground/70">
                  Adicione despesas para ver a distribuição
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
        <button
          onClick={() => router.push("/despesas")}
          className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md hover:border-emerald-200 transition-all text-left group"
        >
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-emerald-500/10 group-hover:bg-emerald-500/20 transition-colors">
              <Plus className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Receita
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Adicionar
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/despesas")}
          className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md hover:border-red-200 transition-all text-left group"
        >
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-red-500/10 group-hover:bg-red-500/20 transition-colors">
              <CreditCard className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-red-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Despesa
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Registrar
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/poupanca")}
          className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md hover:border-blue-200 transition-all text-left group"
        >
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-blue-500/10 group-hover:bg-blue-500/20 transition-colors">
              <PiggyBank className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-blue-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Poupança
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">Metas</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push("/relatorios")}
          className="bg-card rounded-lg md:rounded-xl p-3 md:p-4 lg:p-6 border hover:shadow-md hover:border-purple-200 transition-all text-left group"
        >
          <div className="flex items-center gap-2 md:gap-3 lg:gap-4">
            <div className="p-2 md:p-3 rounded-lg bg-purple-500/10 group-hover:bg-purple-500/20 transition-colors">
              <BarChart3 className="h-4 w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 text-purple-500" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm md:text-base lg:text-lg font-semibold">
                Relatórios
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground">
                Análises
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Transações recentes */}
      <div className="bg-card rounded-lg md:rounded-xl border">
        <div className="p-3 md:p-4 lg:p-6 border-b">
          <div className="flex items-center justify-between">
            <h3 className="text-sm md:text-base lg:text-lg font-semibold">
              Transações Recentes
            </h3>
            <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={loadRecentTransactions}
                className="text-xs md:text-sm text-primary hover:text-primary/80 transition-colors"
              >
                Atualizar
              </button>
              <button
                onClick={() => router.push("/despesas")}
                className="text-xs md:text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
              >
                Ver todas <ArrowRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
        <div className="p-3 md:p-4 lg:p-6">
          {loadingStates.transactions ? (
            <div className="flex items-center justify-center py-6 md:py-8">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
            </div>
          ) : recentTransactions.length > 0 ? (
            <div className="space-y-2 md:space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between py-2 md:py-3 border-b border-border/50 last:border-0 hover:bg-accent/50 transition-colors rounded-lg px-2 md:px-3"
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
                    <div
                      className={`p-1.5 md:p-2 rounded-lg ${
                        transaction.tipo === "receita"
                          ? "bg-emerald-500/10"
                          : transaction.tipo === "despesa"
                          ? "bg-red-500/10"
                          : "bg-blue-500/10"
                      }`}
                    >
                      {transaction.tipo === "receita" ? (
                        <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-emerald-500" />
                      ) : transaction.tipo === "despesa" ? (
                        <TrendingDown className="h-3 w-3 md:h-4 md:w-4 text-red-500" />
                      ) : (
                        <PiggyBank className="h-3 w-3 md:h-4 md:w-4 text-blue-500" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs md:text-sm font-medium truncate">
                        {transaction.descricao}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {transaction.categoria} •{" "}
                        {new Date(transaction.data).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`text-xs md:text-sm font-semibold ${
                        transaction.tipo === "receita" ||
                        transaction.tipo === "poupanca"
                          ? "text-emerald-500"
                          : "text-red-500"
                      }`}
                    >
                      {transaction.tipo === "despesa" ? "-" : "+"}
                      {formatCurrency(transaction.valor)}
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {new Date(transaction.created_at).toLocaleTimeString(
                        "pt-BR",
                        {
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 md:py-8">
              <Calendar className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-3 md:mb-4" />
              <p className="text-sm md:text-base text-muted-foreground mb-2">
                Nenhuma transação encontrada
              </p>
              <p className="text-xs md:text-sm text-muted-foreground/70 mb-3 md:mb-4">
                Comece adicionando suas primeiras transações!
              </p>
              <button
                onClick={() => router.push("/despesas")}
                className="bg-primary text-primary-foreground px-3 md:px-4 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors"
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
          <div className="relative top-4 md:top-20 mx-auto border w-full max-w-md shadow-lg rounded-lg md:rounded-xl bg-card">
            <div className="flex items-center justify-between p-3 md:p-4 border-b">
              <h3 className="text-sm md:text-base lg:text-lg font-medium">
                Nova Meta de Poupança
              </h3>
              <button
                onClick={() => setShowPoupancaModal(false)}
                className="p-1 hover:bg-accent rounded-md transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form
              onSubmit={handlePoupancaSubmit}
              className="p-3 md:p-4 space-y-3 md:space-y-4"
            >
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                  Tipo
                </label>
                <select
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
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
                <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                  Valor (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  value={poupancaForm.valor}
                  onChange={(e) =>
                    setPoupancaForm({ ...poupancaForm, valor: e.target.value })
                  }
                  placeholder="0,00"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1 md:mb-2">
                  Descrição
                </label>
                <input
                  type="text"
                  required
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs md:text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
                  value={poupancaForm.descricao}
                  onChange={(e) =>
                    setPoupancaForm({
                      ...poupancaForm,
                      descricao: e.target.value,
                    })
                  }
                  placeholder="Ex: Reserva de emergência"
                />
              </div>

              <div className="flex justify-end space-x-2 md:space-x-3 pt-2 md:pt-4">
                <button
                  type="button"
                  onClick={() => setShowPoupancaModal(false)}
                  className="px-3 md:px-4 py-1.5 md:py-2 border border-input rounded-md text-xs md:text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-3 md:px-4 py-1.5 md:py-2 bg-primary text-primary-foreground rounded-md text-xs md:text-sm font-medium hover:bg-primary/90 transition-colors"
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
