"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  Printer,
  RefreshCw,
  Loader2,
  Eye,
  EyeOff,
  Filter,
  Download,
  AlertCircle,
  ChevronDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Hook para detectar dispositivo móvel
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Verifica largura da tela e user agent
      const width = window.innerWidth;
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords =
        /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/;

      setIsMobile(width < 768 || mobileKeywords.test(userAgent));
    };

    checkDevice();
    window.addEventListener("resize", checkDevice);

    return () => window.removeEventListener("resize", checkDevice);
  }, []);

  return isMobile;
};

interface CategoryData {
  categoria: string;
  valor: number;
  percentual: number;
}

interface MonthlyEvolution {
  mes: string;
  receitas: number;
  despesas: number;
  saldo: number;
}

interface SavingsGoal {
  descricao: string;
  atual: number;
  objetivo: number;
  progresso: number;
}

interface ReportData {
  totalReceitas: number;
  totalDespesas: number;
  totalPoupanca: number;
  saldoFinal: number;
  totalTransacoes: number;
  totalMetas: number;
  metasAtingidas: number;
  periodo: string;
  despesasPorCategoria: CategoryData[];
  receitasPorCategoria: CategoryData[];
  evolucaoMensal: MonthlyEvolution[];
  metasPoupanca: SavingsGoal[];
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();
  const isMobile = useIsMobile();

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
  }, [user, authLoading, selectedPeriod]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (selectedPeriod) {
      case "current_month":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case "last_month":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case "last_3_months":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case "current_year":
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { start, end } = getDateRange();

      // Buscar dados em paralelo para melhor performance
      const [despesasResult, receitasResult, poupancaResult] =
        await Promise.all([
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

      const despesas = despesasResult.data || [];
      const receitas = receitasResult.data || [];
      const poupancas = poupancaResult.data || [];

      // Calcular totais
      const totalDespesas = despesas.reduce(
        (sum, item) => sum + Number(item.valor || 0),
        0
      );
      const totalReceitas = receitas.reduce(
        (sum, item) => sum + Number(item.valor || 0),
        0
      );
      const totalPoupanca = poupancas.reduce(
        (sum, item) => sum + Number(item.valor_atual || 0),
        0
      );
      const saldoFinal = totalReceitas - totalDespesas;

      // Agrupar por categoria
      const despesasPorCategoria = processCategories(despesas, totalDespesas);
      const receitasPorCategoria = processCategories(receitas, totalReceitas);

      // Evolução mensal
      const evolucaoMensal = processMonthlyEvolution(receitas, despesas);

      // Metas de poupança
      const metasPoupanca = poupancas.map((meta) => ({
        descricao: meta.descricao || "Sem descrição",
        atual: Number(meta.valor_atual || 0),
        objetivo: Number(meta.valor_objetivo || 1),
        progresso: Math.min(
          (Number(meta.valor_atual || 0) / Number(meta.valor_objetivo || 1)) *
            100,
          100
        ),
      }));

      const metasAtingidas = metasPoupanca.filter(
        (meta) => meta.progresso >= 100
      ).length;

      const periodoLabels: Record<string, string> = {
        current_month: "Mês Atual",
        last_month: "Mês Passado",
        last_3_months: "Últimos 3 Meses",
        current_year: "Ano Atual",
      };

      setReportData({
        totalReceitas,
        totalDespesas,
        totalPoupanca,
        saldoFinal,
        totalTransacoes: despesas.length + receitas.length,
        totalMetas: poupancas.length,
        metasAtingidas,
        periodo: periodoLabels[selectedPeriod] || "Período",
        despesasPorCategoria,
        receitasPorCategoria,
        evolucaoMensal,
        metasPoupanca,
      });
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
      setError("Erro ao carregar dados do relatório");
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const processCategories = (items: any[], total: number): CategoryData[] => {
    const categoryMap: Record<string, number> = {};

    items.forEach((item) => {
      const categoria = item.categoria || "Outros";
      categoryMap[categoria] =
        (categoryMap[categoria] || 0) + Number(item.valor || 0);
    });

    return Object.entries(categoryMap)
      .map(([categoria, valor]) => ({
        categoria,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 5); // Limitar a 5 categorias principais
  };

  const processMonthlyEvolution = (
    receitas: any[],
    despesas: any[]
  ): MonthlyEvolution[] => {
    const monthMap: Record<string, { receitas: number; despesas: number }> = {};

    receitas.forEach((item) => {
      const mes = new Date(item.data).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      if (!monthMap[mes]) monthMap[mes] = { receitas: 0, despesas: 0 };
      monthMap[mes].receitas += Number(item.valor || 0);
    });

    despesas.forEach((item) => {
      const mes = new Date(item.data).toLocaleDateString("pt-BR", {
        month: "short",
        year: "2-digit",
      });
      if (!monthMap[mes]) monthMap[mes] = { receitas: 0, despesas: 0 };
      monthMap[mes].despesas += Number(item.valor || 0);
    });

    return Object.entries(monthMap)
      .map(([mes, dados]) => ({
        mes,
        receitas: dados.receitas,
        despesas: dados.despesas,
        saldo: dados.receitas - dados.despesas,
      }))
      .sort((a, b) => {
        const [mesA, anoA] = a.mes.split("/");
        const [mesB, anoB] = b.mes.split("/");
        return anoA.localeCompare(anoB) || mesA.localeCompare(mesB);
      })
      .slice(-6); // Últimos 6 meses
  };

  const formatCurrency = (value: number): string => {
    if (!showValues) return "R$ ••••••";

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const handlePrint = () => {
    if (!reportData) return;

    const printData = {
      ...reportData,
      dataGeracao: new Date().toLocaleString("pt-BR"),
      usuario: user?.email || "Usuário",
    };

    localStorage.setItem("printReportData", JSON.stringify(printData));

    const printWindow = window.open("/relatorios/print", "_blank");
    if (!printWindow) {
      alert("Por favor, permita popups para imprimir o relatório.");
    }
  };

  const handleDownload = async () => {
    if (!reportData) return;

    try {
      // Criar conteúdo CSV
      const csvContent = generateCSV(reportData);

      // Criar blob e download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);

      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `relatorio_financeiro_${new Date().toISOString().split("T")[0]}.csv`
      );
      link.style.visibility = "hidden";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Erro ao gerar download:", err);
      alert("Erro ao gerar arquivo para download");
    }
  };

  const generateCSV = (data: ReportData): string => {
    const lines: string[] = [];

    // Cabeçalho
    lines.push("RELATÓRIO FINANCEIRO");
    lines.push(`Período: ${data.periodo}`);
    lines.push(`Data de Geração: ${new Date().toLocaleString("pt-BR")}`);
    lines.push("");

    // Resumo
    lines.push("RESUMO");
    lines.push(`Total de Receitas,${data.totalReceitas.toFixed(2)}`);
    lines.push(`Total de Despesas,${data.totalDespesas.toFixed(2)}`);
    lines.push(`Saldo Final,${data.saldoFinal.toFixed(2)}`);
    lines.push(`Total em Poupança,${data.totalPoupanca.toFixed(2)}`);
    lines.push("");

    // Despesas por categoria
    if (data.despesasPorCategoria.length > 0) {
      lines.push("DESPESAS POR CATEGORIA");
      lines.push("Categoria,Valor,Percentual");
      data.despesasPorCategoria.forEach((cat) => {
        lines.push(
          `${cat.categoria},${cat.valor.toFixed(2)},${cat.percentual.toFixed(
            1
          )}%`
        );
      });
      lines.push("");
    }

    // Receitas por categoria
    if (data.receitasPorCategoria.length > 0) {
      lines.push("RECEITAS POR CATEGORIA");
      lines.push("Categoria,Valor,Percentual");
      data.receitasPorCategoria.forEach((cat) => {
        lines.push(
          `${cat.categoria},${cat.valor.toFixed(2)},${cat.percentual.toFixed(
            1
          )}%`
        );
      });
      lines.push("");
    }

    // Evolução mensal
    if (data.evolucaoMensal.length > 0) {
      lines.push("EVOLUÇÃO MENSAL");
      lines.push("Mês,Receitas,Despesas,Saldo");
      data.evolucaoMensal.forEach((mes) => {
        lines.push(
          `${mes.mes},${mes.receitas.toFixed(2)},${mes.despesas.toFixed(
            2
          )},${mes.saldo.toFixed(2)}`
        );
      });
    }

    return lines.join("\n");
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReportData();
  };

  // Loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando relatórios...</p>
        </div>
      </div>
    );
  }

  // Erro
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">
            Erro ao carregar relatórios
          </h3>
          <p className="text-sm text-muted-foreground mb-4">{error}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
  }

  // Sem dados
  if (!reportData || reportData.totalTransacoes === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <Wallet className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione transações para gerar relatórios
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Ir para Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              Relatórios Financeiros
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise completa das suas finanças • {reportData.periodo}
            </p>
          </div>

          {/* Controles */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filtro de período */}
            <div className="relative flex-1 min-w-[140px] max-w-[200px]">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                className="w-full appearance-none rounded-lg border bg-background px-3 py-2 pr-8 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20"
              >
                <option value="current_month">Mês Atual</option>
                <option value="last_month">Mês Passado</option>
                <option value="last_3_months">Últimos 3 Meses</option>
                <option value="current_year">Ano Atual</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>

            {/* Botões de ação */}
            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={() => setShowValues(!showValues)}
                className="p-2 rounded-lg border hover:bg-accent transition-colors"
                aria-label={showValues ? "Ocultar valores" : "Mostrar valores"}
              >
                {showValues ? (
                  <Eye className="h-4 w-4" />
                ) : (
                  <EyeOff className="h-4 w-4" />
                )}
              </button>

              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 rounded-lg border hover:bg-accent transition-colors disabled:opacity-50"
                aria-label="Atualizar dados"
              >
                <RefreshCw
                  className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
                />
              </button>

              {/* Botão condicional: Impressão no desktop, Download no mobile */}
              {isMobile ? (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Download className="h-4 w-4" />
                  <span>Baixar</span>
                </button>
              ) : (
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  <Printer className="h-4 w-4" />
                  <span>Imprimir</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Receitas</p>
                <p className="text-base sm:text-lg font-bold text-emerald-500">
                  {formatCurrency(reportData.totalReceitas)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between gap-2">
              <div className="p-2 rounded-lg bg-red-500/10">
                <TrendingDown className="h-4 w-4 sm:h-5 sm:w-5 text-red-500" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Despesas</p>
                <p className="text-base sm:text-lg font-bold text-red-500">
                  {formatCurrency(reportData.totalDespesas)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between gap-2">
              <div
                className={`p-2 rounded-lg ${
                  reportData.saldoFinal >= 0
                    ? "bg-emerald-500/10"
                    : "bg-red-500/10"
                }`}
              >
                <Wallet
                  className={`h-4 w-4 sm:h-5 sm:w-5 ${
                    reportData.saldoFinal >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Saldo</p>
                <p
                  className={`text-base sm:text-lg font-bold ${
                    reportData.saldoFinal >= 0
                      ? "text-emerald-500"
                      : "text-red-500"
                  }`}
                >
                  {formatCurrency(reportData.saldoFinal)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <div className="flex items-center justify-between gap-2">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <PiggyBank className="h-4 w-4 sm:h-5 sm:w-5 text-blue-500" />
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Poupança</p>
                <p className="text-base sm:text-lg font-bold text-blue-500">
                  {formatCurrency(reportData.totalPoupanca)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3">Transações</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">
                  {reportData.totalTransacoes}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Período:</span>
                <span className="font-medium">{reportData.periodo}</span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3">Metas</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Total:</span>
                <span className="font-medium">{reportData.totalMetas}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Atingidas:</span>
                <span className="font-medium text-emerald-600">
                  {reportData.metasAtingidas}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4 border">
            <h3 className="font-semibold mb-3">Análise</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Economia:</span>
                <span
                  className={`font-medium ${
                    reportData.saldoFinal >= 0
                      ? "text-emerald-600"
                      : "text-red-600"
                  }`}
                >
                  {reportData.totalReceitas > 0
                    ? `${(
                        (reportData.saldoFinal / reportData.totalReceitas) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Maior gasto:</span>
                <span className="font-medium truncate ml-2">
                  {reportData.despesasPorCategoria[0]?.categoria || "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Despesas por categoria */}
        {reportData.despesasPorCategoria.length > 0 && (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Despesas por Categoria</h3>
            </div>
            <div className="p-4 space-y-3">
              {reportData.despesasPorCategoria.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {cat.categoria}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold">
                      {formatCurrency(cat.valor)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentual.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Receitas por categoria */}
        {reportData.receitasPorCategoria.length > 0 && (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Receitas por Categoria</h3>
            </div>
            <div className="p-4 space-y-3">
              {reportData.receitasPorCategoria.map((cat, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 flex-shrink-0" />
                    <span className="text-sm font-medium truncate">
                      {cat.categoria}
                    </span>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold">
                      {formatCurrency(cat.valor)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {cat.percentual.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Evolução mensal */}
        {reportData.evolucaoMensal.length > 0 && (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Evolução Mensal</h3>
            </div>
            <div className="p-4">
              <div className="space-y-2">
                {/* Header da tabela - apenas no desktop */}
                <div className="hidden sm:grid sm:grid-cols-4 text-xs text-muted-foreground font-medium pb-2 border-b">
                  <div>Mês</div>
                  <div className="text-right">Receitas</div>
                  <div className="text-right">Despesas</div>
                  <div className="text-right">Saldo</div>
                </div>

                {/* Dados */}
                {reportData.evolucaoMensal.map((mes, idx) => (
                  <div key={idx} className="py-2 border-b last:border-0">
                    {/* Mobile: layout em blocos */}
                    <div className="sm:hidden space-y-1">
                      <div className="font-medium text-sm">{mes.mes}</div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-muted-foreground">
                            Receitas:
                          </span>
                          <div className="font-medium text-emerald-600">
                            {formatCurrency(mes.receitas)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">
                            Despesas:
                          </span>
                          <div className="font-medium text-red-600">
                            {formatCurrency(mes.despesas)}
                          </div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Saldo:</span>
                          <div
                            className={`font-medium ${
                              mes.saldo >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {formatCurrency(mes.saldo)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: layout em grid */}
                    <div className="hidden sm:grid sm:grid-cols-4 text-sm">
                      <div className="font-medium">{mes.mes}</div>
                      <div className="text-right text-emerald-600">
                        {formatCurrency(mes.receitas)}
                      </div>
                      <div className="text-right text-red-600">
                        {formatCurrency(mes.despesas)}
                      </div>
                      <div
                        className={`text-right font-medium ${
                          mes.saldo >= 0 ? "text-emerald-600" : "text-red-600"
                        }`}
                      >
                        {formatCurrency(mes.saldo)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Metas de poupança */}
        {reportData.metasPoupanca.length > 0 && (
          <div className="bg-card rounded-lg border">
            <div className="p-4 border-b">
              <h3 className="font-semibold">Metas de Poupança</h3>
            </div>
            <div className="p-4 space-y-4">
              {reportData.metasPoupanca.slice(0, 5).map((meta, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-medium truncate">
                      {meta.descricao}
                    </span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">
                      {meta.progresso.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        meta.progresso >= 100 ? "bg-emerald-500" : "bg-blue-500"
                      }`}
                      style={{ width: `${Math.min(meta.progresso, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatCurrency(meta.atual)}</span>
                    <span>{formatCurrency(meta.objetivo)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
