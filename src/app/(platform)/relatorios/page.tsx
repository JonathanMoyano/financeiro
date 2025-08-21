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
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Target,
  Activity,
  FileText,
  Share2,
  Info,
  ChevronRight,
  BarChart3,
  PieChart,
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
  tipo: "receita" | "despesa";
  forma_pagamento?: string;
  recorrente?: boolean;
}

interface CategoryData {
  categoria: string;
  valor: number;
  percentual: number;
  quantidade: number;
  media: number;
  transacoes: Transaction[];
}

interface MonthlyData {
  mes: string;
  mesNumero: number;
  ano: number;
  receitas: number;
  despesas: number;
  saldo: number;
  quantidadeTransacoes: number;
  economia: number;
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
  mediaTransacao: number;
  transacoesPorDia: number;
}

interface ReportFilters {
  periodo: string;
  categorias: string[];
  tipoTransacao: "todas" | "receitas" | "despesas";
  formaPagamento: string[];
  valorMinimo?: number;
  valorMaximo?: number;
  customDateRange?: {
    start: string;
    end: string;
  };
} // Componente de Cartão Métrica Minimalista
const MetricCard = ({
  icon: Icon,
  label,
  value,
  trend,
  color = "default",
  showValue = true,
  subtitle,
  onClick,
}: {
  icon: any;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  color?: string;
  showValue?: boolean;
  subtitle?: string;
  onClick?: () => void;
}) => {
  const colorClasses = {
    default: "text-muted-foreground",
    success: "text-emerald-600",
    danger: "text-red-600",
    info: "text-blue-600",
    warning: "text-amber-600",
    primary: "text-primary",
  };

  return (
    <div
      className={`bg-white rounded-lg p-4 border border-border/60 hover:border-border transition-all hover:shadow-sm ${
        onClick ? "cursor-pointer" : ""
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon
            className={`h-4 w-4 ${
              colorClasses[color as keyof typeof colorClasses]
            }`}
          />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        {trend && (
          <div
            className={`flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full ${
              trend.isPositive
                ? "text-emerald-600 bg-emerald-50"
                : "text-red-600 bg-red-50"
            }`}
          >
            {trend.isPositive ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : (
              <ArrowDownRight className="h-3 w-3" />
            )}
            <span>{Math.abs(trend.value).toFixed(1)}%</span>
          </div>
        )}
      </div>

      <div className="space-y-1">
        <p className="text-xl font-semibold text-foreground">
          {showValue ? value : "••••••"}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>
    </div>
  );
};
// Componente de Filtros
const FilterPanel = ({
  filters,
  setFilters,
  categories,
  paymentMethods,
}: {
  filters: ReportFilters;
  setFilters: (filters: ReportFilters) => void;
  categories: string[];
  paymentMethods: string[];
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  return (
    <div className="bg-white rounded-lg border border-border/60 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium text-sm">Filtros</span>
        </div>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          {showAdvanced ? "Ocultar" : "Avançados"}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Período */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Período</label>
          <select
            value={filters.periodo}
            onChange={(e) =>
              setFilters({ ...filters, periodo: e.target.value })
            }
            className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          >
            <option value="hoje">Hoje</option>
            <option value="semana">Última Semana</option>
            <option value="mes_atual">Mês Atual</option>
            <option value="mes_passado">Mês Passado</option>
            <option value="3_meses">Últimos 3 Meses</option>
            <option value="6_meses">Últimos 6 Meses</option>
            <option value="ano">Este Ano</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {/* Tipo de Transação */}
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Tipo</label>
          <select
            value={filters.tipoTransacao}
            onChange={(e) =>
              setFilters({ ...filters, tipoTransacao: e.target.value as any })
            }
            className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
          >
            <option value="todas">Todas</option>
            <option value="receitas">Receitas</option>
            <option value="despesas">Despesas</option>
          </select>
        </div>

        {/* Categorias (se avançado estiver ativo) */}
        {showAdvanced && (
          <>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Categorias
              </label>
              <select
                multiple
                value={filters.categorias}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFilters({ ...filters, categorias: selected });
                }}
                className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-h-[80px]"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">
                Forma de Pagamento
              </label>
              <select
                multiple
                value={filters.formaPagamento}
                onChange={(e) => {
                  const selected = Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  );
                  setFilters({ ...filters, formaPagamento: selected });
                }}
                className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 min-h-[80px]"
              >
                {paymentMethods.map((method) => (
                  <option key={method} value={method}>
                    {method}
                  </option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Data customizada */}
      {filters.periodo === "custom" && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Data Inicial
            </label>

            <input
              type="date"
              value={filters.customDateRange?.start || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  customDateRange: {
                    ...filters.customDateRange,
                    start: e.target.value,
                    end:
                      filters.customDateRange?.end ||
                      new Date().toISOString().split("T")[0],
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Data Final</label>
            <input
              type="date"
              value={filters.customDateRange?.end || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  customDateRange: {
                    ...filters.customDateRange,
                    start:
                      filters.customDateRange?.start ||
                      new Date().toISOString().split("T")[0],
                    end: e.target.value,
                  },
                })
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
        </div>
      )}

      {/* Filtros de valor (se avançado estiver ativo) */}
      {showAdvanced && (
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Valor Mínimo
            </label>
            <input
              type="number"
              placeholder="0.00"
              value={filters.valorMinimo || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  valorMinimo: parseFloat(e.target.value) || undefined,
                })
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">
              Valor Máximo
            </label>
            <input
              type="number"
              placeholder="1000.00"
              value={filters.valorMaximo || ""}
              onChange={(e) =>
                setFilters({
                  ...filters,
                  valorMaximo: parseFloat(e.target.value) || undefined,
                })
              }
              className="w-full px-3 py-2 text-sm rounded-md border border-border/60 bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
            />
          </div>
        </div>
      )}
    </div>
  );
};
// Componente Principal
export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [showValues, setShowValues] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "resumo" | "categorias" | "tendencias" | "insights"
  >("resumo");

  const [filters, setFilters] = useState<ReportFilters>({
    periodo: "mes_atual",
    categorias: [],
    tipoTransacao: "todas",
    formaPagamento: [],
  });

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [summary, setSummary] = useState<ReportSummary | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [allPaymentMethods, setAllPaymentMethods] = useState<string[]>([]);

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
      // Adicionar debounce para evitar muitas chamadas
      const timeoutId = setTimeout(() => {
        loadReportData();
      }, 500); // Espera 500ms antes de executar

      return () => clearTimeout(timeoutId);
    }
  }, [
    user,
    authLoading,
    filters.periodo,
    filters.tipoTransacao,
    filters.categorias,
    filters.formaPagamento,
    filters.valorMinimo,
    filters.valorMaximo,
  ]);
  // Função para obter range de datas
  // Função para obter range de datas
  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      23,
      59,
      59
    );

    switch (filters.periodo) {
      case "hoje":
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          0,
          0,
          0
        );
        endDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          23,
          59,
          59
        );
        break;
      case "semana":
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        startDate.setHours(0, 0, 0, 0);
        break;
      case "mes_atual":
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
        break;
      case "mes_passado":
        startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case "3_meses":
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1, 0, 0, 0);
        break;
      case "6_meses":
        startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1, 0, 0, 0);
        break;
      case "ano":
        startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
        break;
      case "custom":
        if (filters.customDateRange?.start && filters.customDateRange?.end) {
          try {
            startDate = new Date(filters.customDateRange.start + "T00:00:00");
            endDate = new Date(filters.customDateRange.end + "T23:59:59");

            // Validar se as datas são válidas
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              throw new Error("Datas inválidas");
            }

            // Validar se a data inicial não é maior que a final
            if (startDate > endDate) {
              const temp = startDate;
              startDate = endDate;
              endDate = temp;
            }
          } catch (error) {
            console.warn("Erro ao processar datas customizadas:", error);
            // Fallback para o mês atual
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(
              now.getFullYear(),
              now.getMonth() + 1,
              0,
              23,
              59,
              59
            );
          }
        } else {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(
            now.getFullYear(),
            now.getMonth() + 1,
            0,
            23,
            59,
            59
          );
        }
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        endDate = new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0,
          23,
          59,
          59
        );
    }

    // Validar se as datas são válidas
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      console.error("❌ Datas inválidas:", { startDate, endDate, filters });
      // Fallback para o mês atual
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    return {
      start: startDate.toISOString().split("T")[0],
      end: endDate.toISOString().split("T")[0],
    };
  };

  // Aplicar filtros nas transações
  const applyFilters = (allTransactions: Transaction[]): Transaction[] => {
    return allTransactions.filter((transaction) => {
      // Filtro por tipo
      if (filters.tipoTransacao !== "todas") {
        if (
          filters.tipoTransacao === "receitas" &&
          transaction.tipo !== "receita"
        ) {
          return false;
        }
        if (
          filters.tipoTransacao === "despesas" &&
          transaction.tipo !== "despesa"
        ) {
          return false;
        }
      }

      // Filtro por categorias
      if (
        filters.categorias.length > 0 &&
        !filters.categorias.includes(transaction.categoria)
      ) {
        return false;
      }

      // Filtro por forma de pagamento
      if (
        filters.formaPagamento.length > 0 &&
        transaction.forma_pagamento &&
        !filters.formaPagamento.includes(transaction.forma_pagamento)
      ) {
        return false;
      }

      // Filtro por valor
      if (
        filters.valorMinimo !== undefined &&
        transaction.valor < filters.valorMinimo
      ) {
        return false;
      }

      if (
        filters.valorMaximo !== undefined &&
        transaction.valor > filters.valorMaximo
      ) {
        return false;
      }

      return true;
    });
  };
  // Carregar dados do relatório
  const loadReportData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { start, end } = getDateRange();
      console.log("📅 Período atual:", filters.periodo);
      console.log("📅 Datas calculadas:", { start, end });
      console.log("📅 Data atual:", new Date().toISOString());

      // Buscar dados em paralelo
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
      console.log("📊 Resultados do banco:");
      console.log("Despesas encontradas:", despesasResult.data?.length);
      console.log("Receitas encontradas:", receitasResult.data?.length);
      console.log("Algumas despesas:", despesasResult.data?.slice(0, 3));
      console.log("Algumas receitas:", receitasResult.data?.slice(0, 3));

      if (despesasResult.error) throw despesasResult.error;
      if (receitasResult.error) throw receitasResult.error;
      if (poupancaResult.error) throw poupancaResult.error;

      // Processar transações
      const despesas: Transaction[] = (despesasResult.data || []).map((d) => ({
        id: d.id,
        descricao: d.descricao,
        valor: Number(d.valor),
        categoria: d.categoria || "Outros",
        data: d.data,
        tipo: "despesa" as const,
        forma_pagamento: d.forma_pagamento,
        recorrente: d.recorrente,
      }));

      const receitas: Transaction[] = (receitasResult.data || []).map((r) => ({
        id: r.id,
        descricao: r.descricao,
        valor: Number(r.valor),
        categoria: r.categoria || "Outros",
        data: r.data,
        tipo: "receita" as const,
        recorrente: r.recorrente,
      }));

      const allTransactions = [...despesas, ...receitas].sort(
        (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
      );

      // Combinar categorias do banco com categorias padrão
      const categoriesFromTransactions = [
        ...new Set(allTransactions.map((t) => t.categoria)),
      ].filter((cat): cat is string => Boolean(cat));

      const categoriasPadrao = [
        "Alimentação",
        "Transporte",
        "Saúde",
        "Educação",
        "Lazer",
        "Casa",
        "Roupas",
        "Salário",
        "Freelance",
        "Investimentos",
        "Vendas",
        "Outros",
      ];

      const categories = [
        ...new Set([...categoriesFromTransactions, ...categoriasPadrao]),
      ];

      // Combinar métodos do banco com métodos padrão
      const paymentMethodsFromTransactions = [
        ...new Set(allTransactions.map((t) => t.forma_pagamento)),
      ].filter((method): method is string => Boolean(method));

      const metodosPadrao = [
        "Dinheiro",
        "Cartão de Débito",
        "Cartão de Crédito",
        "PIX",
        "Transferência",
        "Boleto",
      ];

      const paymentMethods = [
        ...new Set([...paymentMethodsFromTransactions, ...metodosPadrao]),
      ];

      // Debug para verificar (pode remover depois que testar)
      console.log("📋 Categorias do banco:", categoriesFromTransactions);
      console.log("📋 Categorias finais:", categories);
      console.log("💳 Métodos do banco:", paymentMethodsFromTransactions);
      console.log("💳 Métodos finais:", paymentMethods);

      setAllCategories(categories);
      setAllPaymentMethods(paymentMethods);

      // Aplicar filtros
      const filteredTransactions = applyFilters(allTransactions);

      // Processar metas de poupança
      const goals: SavingsGoal[] = (poupancaResult.data || []).map((p) => ({
        id: p.id,
        descricao: p.descricao,
        valor_atual: Number(p.valor_atual || 0),
        valor_objetivo: Number(p.valor_objetivo || 1),
        progresso: Math.min(
          (Number(p.valor_atual || 0) / Number(p.valor_objetivo || 1)) * 100,
          100
        ),
        prazo: p.prazo,
        categoria: p.categoria,
      }));

      // Calcular resumo baseado nas transações filtradas
      const receitasFiltradas = filteredTransactions.filter(
        (t) => t.tipo === "receita"
      );
      const despesasFiltradas = filteredTransactions.filter(
        (t) => t.tipo === "despesa"
      );

      const totalReceitas = receitasFiltradas.reduce(
        (sum, t) => sum + t.valor,
        0
      );
      const totalDespesas = despesasFiltradas.reduce(
        (sum, t) => sum + t.valor,
        0
      );
      const totalPoupanca = goals.reduce((sum, g) => sum + g.valor_atual, 0);
      const saldoAtual = totalReceitas - totalDespesas;

      // Calcular dias no período
      const startDate = new Date(start);
      const endDate = new Date(end);
      const diasNoPeriodo = Math.max(
        1,
        Math.ceil(
          (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      );

      const mediaDiaria = (totalReceitas - totalDespesas) / diasNoPeriodo;
      const projecaoMensal = mediaDiaria * 30;
      const economiaPercentual =
        totalReceitas > 0 ? (saldoAtual / totalReceitas) * 100 : 0;

      // Categoria mais frequente (corrigida)
      const categoriasReceita = receitasFiltradas.reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

      const categoriasDespesa = despesasFiltradas.reduce((acc, t) => {
        acc[t.categoria] = (acc[t.categoria] || 0) + t.valor;
        return acc;
      }, {} as Record<string, number>);

      const principalReceita =
        Object.entries(categoriasReceita).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "N/A";
      const principalDespesa =
        Object.entries(categoriasDespesa).sort((a, b) => b[1] - a[1])[0]?.[0] ||
        "N/A";

      // Métricas adicionais
      const mediaTransacao =
        filteredTransactions.length > 0
          ? filteredTransactions.reduce((sum, t) => sum + t.valor, 0) /
            filteredTransactions.length
          : 0;

      const transacoesPorDia = filteredTransactions.length / diasNoPeriodo;

      setSummary({
        totalReceitas,
        totalDespesas,
        totalPoupanca,
        saldoAtual,
        economiaPercentual,
        mediaDiaria,
        projecaoMensal,
        totalTransacoes: filteredTransactions.length,
        categoriasPrincipais: {
          receita: principalReceita,
          despesa: principalDespesa,
        },
        mediaTransacao,
        transacoesPorDia,
      });

      setTransactions(filteredTransactions);
      setSavingsGoals(goals);
    } catch (err) {
      console.error("Erro ao carregar relatório:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };
  // Processar dados por categoria (corrigido)
  const categoryData = useMemo(() => {
    const processCategories = (
      transactions: Transaction[],
      tipo: "receita" | "despesa"
    ): CategoryData[] => {
      const filteredTransactions = transactions.filter((t) => t.tipo === tipo);
      const categoryMap: Record<
        string,
        { total: number; count: number; transactions: Transaction[] }
      > = {};
      const total = filteredTransactions.reduce((sum, t) => sum + t.valor, 0);

      filteredTransactions.forEach((transaction) => {
        const categoria = transaction.categoria || "Sem categoria";
        if (!categoryMap[categoria]) {
          categoryMap[categoria] = { total: 0, count: 0, transactions: [] };
        }
        categoryMap[categoria].total += transaction.valor;
        categoryMap[categoria].count += 1;
        categoryMap[categoria].transactions.push(transaction);
      });

      return Object.entries(categoryMap)
        .map(([categoria, data]) => ({
          categoria,
          valor: data.total,
          percentual: total > 0 ? (data.total / total) * 100 : 0,
          quantidade: data.count,
          media: data.count > 0 ? data.total / data.count : 0,
          transacoes: data.transactions,
        }))
        .sort((a, b) => b.valor - a.valor);
    };

    return {
      despesas: processCategories(transactions, "despesa"),
      receitas: processCategories(transactions, "receita"),
    };
  }, [transactions]);

  // Processar evolução mensal (corrigido)
  const monthlyEvolution = useMemo(() => {
    const monthMap: Record<string, MonthlyData> = {};

    transactions.forEach((t) => {
      try {
        const date = new Date(t.data);
        if (isNaN(date.getTime())) return; // Skip invalid dates

        const monthKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;

        if (!monthMap[monthKey]) {
          monthMap[monthKey] = {
            mes: date.toLocaleDateString("pt-BR", {
              month: "short",
              year: "2-digit",
            }),
            mesNumero: date.getMonth() + 1,
            ano: date.getFullYear(),
            receitas: 0,
            despesas: 0,
            saldo: 0,
            quantidadeTransacoes: 0,
            economia: 0,
          };
        }

        if (t.tipo === "receita") {
          monthMap[monthKey].receitas += t.valor;
        } else {
          monthMap[monthKey].despesas += t.valor;
        }
        monthMap[monthKey].quantidadeTransacoes += 1;
      } catch (error) {
        console.warn("Error processing transaction date:", t.data);
      }
    });

    return Object.values(monthMap)
      .map((m) => ({
        ...m,
        saldo: m.receitas - m.despesas,
        economia:
          m.receitas > 0 ? ((m.receitas - m.despesas) / m.receitas) * 100 : 0,
      }))
      .sort((a, b) => {
        if (a.ano !== b.ano) return a.ano - b.ano;
        return a.mesNumero - b.mesNumero;
      });
  }, [transactions]);
  // Formatar moeda
  const formatCurrency = (value: number): string => {
    if (!showValues) return "R$ ••••••";
    if (typeof value !== "number" || isNaN(value)) return "R$ 0,00";
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
      filtros: filters,
      geradoEm: new Date().toISOString(),
    };

    // Gerar CSV
    const csvLines: string[] = [
      "RELATÓRIO FINANCEIRO COMPLETO",
      `Gerado em: ${new Date().toLocaleString("pt-BR")}`,
      `Período: ${getDateRange().start} até ${getDateRange().end}`,
      "",
      "RESUMO EXECUTIVO",
      `Total de Receitas,${summary.totalReceitas.toFixed(2)}`,
      `Total de Despesas,${summary.totalDespesas.toFixed(2)}`,
      `Saldo Líquido,${summary.saldoAtual.toFixed(2)}`,
      `Total em Poupança,${summary.totalPoupanca.toFixed(2)}`,
      `Taxa de Economia,${summary.economiaPercentual.toFixed(2)}%`,
      `Média Diária,${summary.mediaDiaria.toFixed(2)}`,
      `Projeção Mensal,${summary.projecaoMensal.toFixed(2)}`,
      `Total de Transações,${summary.totalTransacoes}`,
      `Valor Médio por Transação,${summary.mediaTransacao.toFixed(2)}`,
      `Transações por Dia,${summary.transacoesPorDia.toFixed(2)}`,
      "",
      "CATEGORIAS DE DESPESAS",
      "Categoria,Valor Total,Percentual,Quantidade,Valor Médio",
      ...categoryData.despesas.map(
        (cat) =>
          `${cat.categoria},${cat.valor.toFixed(2)},${cat.percentual.toFixed(
            1
          )}%,${cat.quantidade},${cat.media.toFixed(2)}`
      ),
      "",
      "CATEGORIAS DE RECEITAS",
      "Categoria,Valor Total,Percentual,Quantidade,Valor Médio",
      ...categoryData.receitas.map(
        (cat) =>
          `${cat.categoria},${cat.valor.toFixed(2)},${cat.percentual.toFixed(
            1
          )}%,${cat.quantidade},${cat.media.toFixed(2)}`
      ),
      "",
      "EVOLUÇÃO MENSAL",
      "Mês,Receitas,Despesas,Saldo,Taxa de Economia,Transações",
      ...monthlyEvolution.map(
        (month) =>
          `${month.mes},${month.receitas.toFixed(2)},${month.despesas.toFixed(
            2
          )},${month.saldo.toFixed(2)},${month.economia.toFixed(1)}%,${
            month.quantidadeTransacoes
          }`
      ),
      "",
      "TRANSAÇÕES DETALHADAS",
      "Data,Tipo,Categoria,Descrição,Valor,Forma de Pagamento,Recorrente",
      ...transactions.map(
        (t) =>
          `${new Date(t.data).toLocaleDateString("pt-BR")},${t.tipo},${
            t.categoria
          },"${t.descricao}",${t.valor.toFixed(2)},${
            t.forma_pagamento || "N/A"
          },${t.recorrente ? "Sim" : "Não"}`
      ),
    ];

    const blob = new Blob([csvLines.join("\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_financeiro_completo_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    link.click();
  };

  // Compartilhar relatório
  const handleShare = async () => {
    if (!summary) return;

    const shareData = {
      title: "Relatório Financeiro Completo",
      text: `📊 Resumo Financeiro\n\n💰 Receitas: ${formatCurrency(
        summary.totalReceitas
      )}\n💸 Despesas: ${formatCurrency(
        summary.totalDespesas
      )}\n💵 Saldo: ${formatCurrency(
        summary.saldoAtual
      )}\n🎯 Taxa de economia: ${summary.economiaPercentual.toFixed(
        1
      )}%\n📈 Projeção mensal: ${formatCurrency(
        summary.projecaoMensal
      )}\n\n📱 Gerado pelo App Financeiro`,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("Compartilhamento cancelado");
      }
    } else {
      // Fallback: copiar para clipboard
      navigator.clipboard.writeText(shareData.text);
      alert("Dados copiados para a área de transferência!");
    }
  };

  // Atualizar dados
  const handleRefresh = () => {
    setIsRefreshing(true);
    loadReportData();
  };

  // Limpar filtros
  const clearFilters = () => {
    setFilters({
      periodo: "mes_atual",
      categorias: [],
      tipoTransacao: "todas",
      formaPagamento: [],
    });
  };
  // Loading
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">
            Carregando relatório...
          </p>
        </div>
      </div>
    );
  }

  // Sem dados
  if (!summary || summary.totalTransacoes === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Nenhum dado encontrado</h3>
          <p className="text-sm text-muted-foreground mb-4">
            {filters.periodo !== "mes_atual" ||
            filters.tipoTransacao !== "todas" ||
            filters.categorias.length > 0
              ? "Tente ajustar os filtros ou adicione mais transações."
              : "Adicione transações para visualizar seus relatórios financeiros."}
          </p>
          <div className="space-y-2">
            {(filters.periodo !== "mes_atual" ||
              filters.tipoTransacao !== "todas" ||
              filters.categorias.length > 0) && (
              <button
                onClick={clearFilters}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Limpar Filtros
              </button>
            )}
            <button
              onClick={() => router.push("/dashboard")}
              className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
            >
              Ir para Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4 lg:p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Relatórios Financeiros
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Análise completa e detalhada das suas finanças
            </p>
          </div>

          {/* Ações */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-2 rounded-lg bg-white border border-border/60 hover:bg-gray-50 transition-colors"
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
              className="p-2 rounded-lg bg-white border border-border/60 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>

            <button
              onClick={handleShare}
              className="p-2 rounded-lg bg-white border border-border/60 hover:bg-gray-50 transition-colors"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <button
              onClick={handleDownload}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          categories={allCategories}
          paymentMethods={allPaymentMethods}
        />

        {/* Indicador de filtros ativos */}
        {(filters.categorias.length > 0 ||
          filters.formaPagamento.length > 0 ||
          filters.tipoTransacao !== "todas" ||
          filters.periodo !== "mes_atual") && (
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Filtros ativos:</span>
            {filters.tipoTransacao !== "todas" && (
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">
                {filters.tipoTransacao === "receitas" ? "Receitas" : "Despesas"}
              </span>
            )}
            {filters.categorias.length > 0 && (
              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">
                {filters.categorias.length} categoria(s)
              </span>
            )}
            {filters.formaPagamento.length > 0 && (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full">
                {filters.formaPagamento.length} forma(s)
              </span>
            )}
            <button
              onClick={clearFilters}
              className="text-muted-foreground hover:text-foreground transition-colors underline"
            >
              Limpar tudo
            </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white rounded-lg border border-border/60">
          {(
            [
              { key: "resumo", label: "Resumo", icon: BarChart3 },
              { key: "categorias", label: "Categorias", icon: PieChart },
              { key: "tendencias", label: "Tendências", icon: TrendingUp },
              { key: "insights", label: "Insights", icon: Target },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 px-3 py-2 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                activeTab === tab.key
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-gray-50"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
        {/* Conteúdo baseado na tab ativa */}
        {activeTab === "resumo" && (
          <div className="space-y-6">
            {/* Cards principais */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <MetricCard
                icon={TrendingUp}
                label="Receitas Total"
                value={formatCurrency(summary.totalReceitas)}
                color="success"
                showValue={showValues}
                subtitle={`${
                  transactions.filter((t) => t.tipo === "receita").length
                } transações`}
                trend={
                  monthlyEvolution.length >= 2 &&
                  monthlyEvolution[monthlyEvolution.length - 2].receitas > 0
                    ? {
                        value:
                          (monthlyEvolution[monthlyEvolution.length - 1]
                            .receitas /
                            monthlyEvolution[monthlyEvolution.length - 2]
                              .receitas -
                            1) *
                          100,
                        isPositive:
                          monthlyEvolution[monthlyEvolution.length - 1]
                            .receitas >
                          monthlyEvolution[monthlyEvolution.length - 2]
                            .receitas,
                      }
                    : undefined
                }
              />

              <MetricCard
                icon={TrendingDown}
                label="Despesas Total"
                value={formatCurrency(summary.totalDespesas)}
                color="danger"
                showValue={showValues}
                subtitle={`${
                  transactions.filter((t) => t.tipo === "despesa").length
                } transações`}
                trend={
                  monthlyEvolution.length >= 2 &&
                  monthlyEvolution[monthlyEvolution.length - 2].despesas > 0
                    ? {
                        value:
                          (monthlyEvolution[monthlyEvolution.length - 1]
                            .despesas /
                            monthlyEvolution[monthlyEvolution.length - 2]
                              .despesas -
                            1) *
                          100,
                        isPositive:
                          monthlyEvolution[monthlyEvolution.length - 1]
                            .despesas <
                          monthlyEvolution[monthlyEvolution.length - 2]
                            .despesas,
                      }
                    : undefined
                }
              />

              <MetricCard
                icon={Wallet}
                label="Saldo Líquido"
                value={formatCurrency(summary.saldoAtual)}
                color={summary.saldoAtual >= 0 ? "success" : "danger"}
                showValue={showValues}
                subtitle={`${summary.economiaPercentual.toFixed(
                  1
                )}% de economia`}
              />

              <MetricCard
                icon={PiggyBank}
                label="Total Poupado"
                value={formatCurrency(summary.totalPoupanca)}
                color="info"
                showValue={showValues}
                subtitle={`${savingsGoals.length} metas ativas`}
              />
            </div>

            {/* Métricas secundárias */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 border border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4 text-blue-600" />
                  <span className="text-sm text-muted-foreground">
                    Média Diária
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {showValues ? formatCurrency(summary.mediaDiaria) : "••••••"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por dia no período
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-muted-foreground">
                    Projeção 30d
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {showValues
                    ? formatCurrency(summary.projecaoMensal)
                    : "••••••"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Baseado no ritmo atual
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-4 w-4 text-purple-600" />
                  <span className="text-sm text-muted-foreground">
                    Valor Médio
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {showValues
                    ? formatCurrency(summary.mediaTransacao)
                    : "••••••"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Por transação
                </p>
              </div>

              <div className="bg-white rounded-lg p-4 border border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="h-4 w-4 text-amber-600" />
                  <span className="text-sm text-muted-foreground">
                    Frequência
                  </span>
                </div>
                <p className="text-lg font-semibold">
                  {summary.transacoesPorDia.toFixed(1)}/dia
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Transações por dia
                </p>
              </div>
            </div>
            {/* Evolução mensal */}
            {monthlyEvolution.length > 0 && (
              <div className="bg-white rounded-lg border border-border/60">
                <div className="p-4 border-b border-border/30">
                  <h3 className="font-semibold">Evolução Mensal</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos {monthlyEvolution.length} meses • Tendência e
                    performance
                  </p>
                </div>
                <div className="p-4">
                  <div className="space-y-4">
                    {monthlyEvolution.slice(-6).map((month, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">
                            {month.mes}
                          </span>
                          <div className="flex items-center gap-4 text-xs">
                            <div className="text-center">
                              <div className="text-emerald-600">
                                {showValues
                                  ? formatCurrency(month.receitas)
                                  : "••••"}
                              </div>
                              <div className="text-muted-foreground">
                                Receitas
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-red-600">
                                {showValues
                                  ? formatCurrency(month.despesas)
                                  : "••••"}
                              </div>
                              <div className="text-muted-foreground">
                                Despesas
                              </div>
                            </div>
                            <div className="text-center">
                              <div
                                className={`font-semibold ${
                                  month.saldo >= 0
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {showValues
                                  ? formatCurrency(month.saldo)
                                  : "••••"}
                              </div>
                              <div className="text-muted-foreground">Saldo</div>
                            </div>
                          </div>
                        </div>

                        {/* Barra de progresso visual */}
                        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="absolute h-full bg-emerald-500 opacity-30"
                            style={{ width: "100%" }}
                          />
                          {month.receitas > 0 && (
                            <div
                              className="absolute h-full bg-emerald-500"
                              style={{
                                width: `${Math.min(
                                  (month.receitas /
                                    (month.receitas + month.despesas)) *
                                    100,
                                  100
                                )}%`,
                              }}
                            />
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{month.quantidadeTransacoes} transações</span>
                          <span
                            className={
                              month.economia >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }
                          >
                            {month.economia.toFixed(1)}% economia
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            {/* Metas de poupança */}
            {savingsGoals.length > 0 && (
              <div className="bg-white rounded-lg border border-border/60">
                <div className="p-4 border-b border-border/30 flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Metas de Poupança</h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {savingsGoals.filter((g) => g.progresso >= 100).length} de{" "}
                      {savingsGoals.length} atingidas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-blue-600">
                      {Math.round(
                        savingsGoals.reduce((sum, g) => sum + g.progresso, 0) /
                          savingsGoals.length
                      )}
                      %
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Progresso médio
                    </p>
                  </div>
                </div>
                <div className="p-4 space-y-4">
                  {savingsGoals.slice(0, 4).map((goal) => (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {goal.descricao}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {showValues
                              ? formatCurrency(goal.valor_atual)
                              : "••••"}{" "}
                            de{" "}
                            {showValues
                              ? formatCurrency(goal.valor_objetivo)
                              : "••••"}
                            {goal.prazo &&
                              ` • Meta: ${new Date(
                                goal.prazo
                              ).toLocaleDateString("pt-BR")}`}
                          </p>
                        </div>
                        <span
                          className={`text-sm font-semibold px-2 py-1 rounded-full ${
                            goal.progresso >= 100
                              ? "text-emerald-600 bg-emerald-50"
                              : goal.progresso >= 75
                              ? "text-blue-600 bg-blue-50"
                              : "text-amber-600 bg-amber-50"
                          }`}
                        >
                          {goal.progresso.toFixed(0)}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-500 ${
                            goal.progresso >= 100
                              ? "bg-emerald-500"
                              : goal.progresso >= 75
                              ? "bg-blue-500"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${Math.min(goal.progresso, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}

                  {savingsGoals.length > 4 && (
                    <div className="text-center pt-2">
                      <span className="text-xs text-muted-foreground">
                        e mais {savingsGoals.length - 4} meta(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
        {activeTab === "categorias" && (
          <div className="space-y-6">
            {/* Resumo das categorias */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Despesas por categoria */}
              {categoryData.despesas.length > 0 && (
                <div className="bg-white rounded-lg border border-border/60">
                  <div className="p-4 border-b border-border/30">
                    <h3 className="font-semibold text-red-600">
                      Despesas por Categoria
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {categoryData.despesas.length} categorias •{" "}
                      {formatCurrency(
                        categoryData.despesas.reduce(
                          (sum, cat) => sum + cat.valor,
                          0
                        )
                      )}{" "}
                      total
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {categoryData.despesas.slice(0, 8).map((cat, idx) => (
                        <div
                          key={`${cat.categoria}-${idx}`}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {cat.categoria}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cat.quantidade} transação(es) • Média:{" "}
                                {showValues
                                  ? formatCurrency(cat.media)
                                  : "••••"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-red-600">
                                {showValues
                                  ? formatCurrency(cat.valor)
                                  : "••••"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cat.percentual.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500 transition-all duration-500"
                              style={{ width: `${cat.percentual}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {categoryData.despesas.length > 8 && (
                        <div className="text-center pt-2">
                          <span className="text-xs text-muted-foreground">
                            e mais {categoryData.despesas.length - 8}{" "}
                            categoria(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Receitas por categoria */}
              {categoryData.receitas.length > 0 && (
                <div className="bg-white rounded-lg border border-border/60">
                  <div className="p-4 border-b border-border/30">
                    <h3 className="font-semibold text-emerald-600">
                      Receitas por Categoria
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {categoryData.receitas.length} categorias •{" "}
                      {formatCurrency(
                        categoryData.receitas.reduce(
                          (sum, cat) => sum + cat.valor,
                          0
                        )
                      )}{" "}
                      total
                    </p>
                  </div>
                  <div className="p-4">
                    <div className="space-y-3">
                      {categoryData.receitas.slice(0, 8).map((cat, idx) => (
                        <div
                          key={`${cat.categoria}-${idx}`}
                          className="space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {cat.categoria}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cat.quantidade} transação(es) • Média:{" "}
                                {showValues
                                  ? formatCurrency(cat.media)
                                  : "••••"}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-emerald-600">
                                {showValues
                                  ? formatCurrency(cat.valor)
                                  : "••••"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {cat.percentual.toFixed(1)}%
                              </p>
                            </div>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 transition-all duration-500"
                              style={{ width: `${cat.percentual}%` }}
                            />
                          </div>
                        </div>
                      ))}

                      {categoryData.receitas.length > 8 && (
                        <div className="text-center pt-2">
                          <span className="text-xs text-muted-foreground">
                            e mais {categoryData.receitas.length - 8}{" "}
                            categoria(s)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            {/* Transações recentes por categoria */}
            <div className="bg-white rounded-lg border border-border/60">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Transações Recentes</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Últimas {Math.min(20, transactions.length)} de{" "}
                  {transactions.length} transações filtradas
                </p>
              </div>
              <div className="divide-y divide-border/30">
                {transactions.slice(0, 20).map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {transaction.descricao}
                        </p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground">
                            {new Date(transaction.data).toLocaleDateString(
                              "pt-BR"
                            )}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                            {transaction.categoria}
                          </span>
                          {transaction.forma_pagamento && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                              {transaction.forma_pagamento}
                            </span>
                          )}
                          {transaction.recorrente && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">
                              Recorrente
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-sm font-semibold ${
                            transaction.tipo === "receita"
                              ? "text-emerald-600"
                              : "text-red-600"
                          }`}
                        >
                          {transaction.tipo === "receita" ? "+" : "-"}
                          {showValues
                            ? formatCurrency(transaction.valor)
                                .replace("R$", "")
                                .trim()
                            : "••••"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        {activeTab === "tendencias" && (
          <div className="space-y-6">
            {/* Comparativo de períodos */}
            {monthlyEvolution.length >= 2 && (
              <div className="bg-white rounded-lg border border-border/60">
                <div className="p-4 border-b border-border/30">
                  <h3 className="font-semibold">Comparativo de Períodos</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Variação entre{" "}
                    {monthlyEvolution[monthlyEvolution.length - 2].mes} e{" "}
                    {monthlyEvolution[monthlyEvolution.length - 1].mes}
                  </p>
                </div>
                <div className="p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-emerald-50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Receitas
                      </div>
                      <div className="text-xl font-bold text-emerald-600">
                        {monthlyEvolution.length >= 2 &&
                        monthlyEvolution[monthlyEvolution.length - 2].receitas >
                          0
                          ? (
                              (monthlyEvolution[monthlyEvolution.length - 1]
                                .receitas /
                                monthlyEvolution[monthlyEvolution.length - 2]
                                  .receitas -
                                1) *
                              100
                            ).toFixed(1)
                          : "0"}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {showValues
                          ? formatCurrency(
                              monthlyEvolution[monthlyEvolution.length - 1]
                                .receitas -
                                monthlyEvolution[monthlyEvolution.length - 2]
                                  .receitas
                            )
                          : "••••"}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-red-50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Despesas
                      </div>
                      <div className="text-xl font-bold text-red-600">
                        {monthlyEvolution.length >= 2 &&
                        monthlyEvolution[monthlyEvolution.length - 2].despesas >
                          0
                          ? (
                              (monthlyEvolution[monthlyEvolution.length - 1]
                                .despesas /
                                monthlyEvolution[monthlyEvolution.length - 2]
                                  .despesas -
                                1) *
                              100
                            ).toFixed(1)
                          : "0"}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {showValues
                          ? formatCurrency(
                              monthlyEvolution[monthlyEvolution.length - 1]
                                .despesas -
                                monthlyEvolution[monthlyEvolution.length - 2]
                                  .despesas
                            )
                          : "••••"}
                      </div>
                    </div>

                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">
                        Saldo
                      </div>
                      <div
                        className={`text-xl font-bold ${
                          monthlyEvolution[monthlyEvolution.length - 1].saldo >
                          monthlyEvolution[monthlyEvolution.length - 2].saldo
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {monthlyEvolution.length >= 2 &&
                        monthlyEvolution[monthlyEvolution.length - 2].saldo !==
                          0
                          ? (
                              (monthlyEvolution[monthlyEvolution.length - 1]
                                .saldo /
                                Math.abs(
                                  monthlyEvolution[monthlyEvolution.length - 2]
                                    .saldo
                                )) *
                                100 -
                              100
                            ).toFixed(1)
                          : monthlyEvolution[monthlyEvolution.length - 1]
                              .saldo > 0
                          ? "+100"
                          : "-100"}
                        %
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {showValues
                          ? formatCurrency(
                              monthlyEvolution[monthlyEvolution.length - 1]
                                .saldo -
                                monthlyEvolution[monthlyEvolution.length - 2]
                                  .saldo
                            )
                          : "••••"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Evolução detalhada */}
            <div className="bg-white rounded-lg border border-border/60">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Evolução Detalhada</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Histórico completo dos últimos {monthlyEvolution.length} meses
                </p>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  {monthlyEvolution.map((month, idx) => (
                    <div key={idx} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{month.mes}</h4>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-emerald-600">
                            ↗{" "}
                            {showValues
                              ? formatCurrency(month.receitas)
                              : "••••"}
                          </span>
                          <span className="text-red-600">
                            ↘{" "}
                            {showValues
                              ? formatCurrency(month.despesas)
                              : "••••"}
                          </span>
                          <span
                            className={`font-semibold ${
                              month.saldo >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            ={" "}
                            {showValues ? formatCurrency(month.saldo) : "••••"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                        <div>
                          <div className="text-muted-foreground">
                            Transações
                          </div>
                          <div className="font-medium">
                            {month.quantidadeTransacoes}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Taxa de Economia
                          </div>
                          <div
                            className={`font-medium ${
                              month.economia >= 0
                                ? "text-emerald-600"
                                : "text-red-600"
                            }`}
                          >
                            {month.economia.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Média Receita
                          </div>
                          <div className="font-medium">
                            {(() => {
                              const receitasDoMes = transactions.filter(
                                (t) =>
                                  t.tipo === "receita" &&
                                  new Date(t.data).getMonth() ===
                                    month.mesNumero - 1 &&
                                  new Date(t.data).getFullYear() === month.ano
                              );
                              return receitasDoMes.length > 0
                                ? showValues
                                  ? formatCurrency(
                                      month.receitas / receitasDoMes.length
                                    )
                                  : "••••"
                                : "R$ 0,00";
                            })()}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">
                            Média Despesa
                          </div>
                          <div className="font-medium">
                            {(() => {
                              const despesasDoMes = transactions.filter(
                                (t) =>
                                  t.tipo === "despesa" &&
                                  new Date(t.data).getMonth() ===
                                    month.mesNumero - 1 &&
                                  new Date(t.data).getFullYear() === month.ano
                              );
                              return despesasDoMes.length > 0
                                ? showValues
                                  ? formatCurrency(
                                      month.despesas / despesasDoMes.length
                                    )
                                  : "••••"
                                : "R$ 0,00";
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* Gráfico visual simples */}
                      <div className="mt-3 space-y-2">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                          <span>
                            Receitas (
                            {month.receitas > 0
                              ? (
                                  (month.receitas /
                                    (month.receitas + month.despesas)) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-500"
                            style={{
                              width: `${
                                month.receitas > 0
                                  ? (month.receitas /
                                      (month.receitas + month.despesas)) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>

                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          <span>
                            Despesas (
                            {month.despesas > 0
                              ? (
                                  (month.despesas /
                                    (month.receitas + month.despesas)) *
                                  100
                                ).toFixed(1)
                              : "0"}
                            %)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-red-500"
                            style={{
                              width: `${
                                month.despesas > 0
                                  ? (month.despesas /
                                      (month.receitas + month.despesas)) *
                                    100
                                  : 0
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Análise de padrões */}
            <div className="bg-white rounded-lg border border-border/60">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Análise de Padrões</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Identificação de tendências e comportamentos financeiros
                </p>
              </div>
              <div className="p-4 space-y-4">
                {/* Padrão de crescimento */}
                {monthlyEvolution.length >= 3 && (
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Tendência de Crescimento
                    </h4>
                    <div className="text-xs text-blue-700">
                      {(() => {
                        const ultimosTresMeses = monthlyEvolution.slice(-3);
                        const crescimentoReceitas = ultimosTresMeses.every(
                          (mes, idx) =>
                            idx === 0 ||
                            mes.receitas >= ultimosTresMeses[idx - 1].receitas
                        );
                        const crescimentoDespesas = ultimosTresMeses.every(
                          (mes, idx) =>
                            idx === 0 ||
                            mes.despesas >= ultimosTresMeses[idx - 1].despesas
                        );

                        if (crescimentoReceitas && !crescimentoDespesas) {
                          return "📈 Excelente! Suas receitas estão crescendo consistentemente enquanto as despesas se mantêm controladas.";
                        } else if (crescimentoReceitas && crescimentoDespesas) {
                          return "⚠️ Receitas e despesas estão crescendo. Monitore para manter o equilíbrio.";
                        } else if (
                          !crescimentoReceitas &&
                          crescimentoDespesas
                        ) {
                          return "🚨 Atenção! Despesas crescendo enquanto receitas estagnadas. Revisar gastos.";
                        } else {
                          return "📊 Padrão estável nos últimos meses. Considere estratégias de crescimento.";
                        }
                      })()}
                    </div>
                  </div>
                )}

                {/* Sazonalidade */}
                <div className="p-3 bg-amber-50 rounded-lg">
                  <h4 className="text-sm font-medium text-amber-800 mb-2">
                    Análise Sazonal
                  </h4>
                  <div className="text-xs text-amber-700">
                    {(() => {
                      if (monthlyEvolution.length < 6) {
                        return "Dados insuficientes para análise sazonal completa.";
                      }

                      const mediaGeral =
                        monthlyEvolution.reduce((sum, m) => sum + m.saldo, 0) /
                        monthlyEvolution.length;
                      const mesAtual =
                        monthlyEvolution[monthlyEvolution.length - 1];

                      if (mesAtual.saldo > mediaGeral * 1.2) {
                        return "🌟 Mês acima da média! Aproveite para aumentar as reservas.";
                      } else if (mesAtual.saldo < mediaGeral * 0.8) {
                        return "📉 Mês abaixo da média. Revisar gastos extras ou receitas reduzidas.";
                      } else {
                        return "📊 Desempenho dentro da média histórica.";
                      }
                    })()}
                  </div>
                </div>

                {/* Previsibilidade */}
                <div className="p-3 bg-green-50 rounded-lg">
                  <h4 className="text-sm font-medium text-green-800 mb-2">
                    Previsibilidade
                  </h4>
                  <div className="text-xs text-green-700">
                    {(() => {
                      const transacoesRecorrentes = transactions.filter(
                        (t) => t.recorrente
                      ).length;
                      const percentualRecorrente =
                        (transacoesRecorrentes / transactions.length) * 100;

                      if (percentualRecorrente >= 60) {
                        return `🎯 Alto controle: ${percentualRecorrente.toFixed(
                          0
                        )}% das transações são previsíveis.`;
                      } else if (percentualRecorrente >= 30) {
                        return `⚖️ Controle moderado: ${percentualRecorrente.toFixed(
                          0
                        )}% das transações são previsíveis.`;
                      } else {
                        return `🎲 Baixa previsibilidade: ${percentualRecorrente.toFixed(
                          0
                        )}% das transações são recorrentes. Considere mais planejamento.`;
                      }
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {activeTab === "insights" && (
          <div className="space-y-6">
            {/* Score financeiro */}
            <div className="bg-white rounded-lg border border-border/60">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Score Financeiro</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Avaliação geral da sua saúde financeira
                </p>
              </div>
              <div className="p-4">
                {(() => {
                  let score = 0;
                  const insights = [];

                  // Taxa de economia (0-30 pontos)
                  if (summary.economiaPercentual >= 20) {
                    score += 30;
                    insights.push({
                      type: "success",
                      text: "Taxa de economia excelente (≥20%)",
                    });
                  } else if (summary.economiaPercentual >= 10) {
                    score += 20;
                    insights.push({
                      type: "warning",
                      text: "Taxa de economia boa (10-19%)",
                    });
                  } else if (summary.economiaPercentual >= 0) {
                    score += 10;
                    insights.push({
                      type: "danger",
                      text: "Taxa de economia baixa (0-9%)",
                    });
                  } else {
                    insights.push({
                      type: "danger",
                      text: "Gastando mais que ganha (deficit)",
                    });
                  }

                  // Diversificação de receitas (0-25 pontos)
                  const categoriasReceita = categoryData.receitas.length;
                  if (categoriasReceita >= 3) {
                    score += 25;
                    insights.push({
                      type: "success",
                      text: "Receitas diversificadas",
                    });
                  } else if (categoriasReceita >= 2) {
                    score += 15;
                    insights.push({
                      type: "warning",
                      text: "Receitas moderadamente diversificadas",
                    });
                  } else {
                    score += 5;
                    insights.push({
                      type: "danger",
                      text: "Dependência de uma fonte de receita",
                    });
                  }

                  // Controle de gastos (0-25 pontos)
                  const maiorCategoriaDespesa = categoryData.despesas[0];
                  if (
                    maiorCategoriaDespesa &&
                    maiorCategoriaDespesa.percentual < 40
                  ) {
                    score += 25;
                    insights.push({
                      type: "success",
                      text: "Gastos bem distribuídos",
                    });
                  } else if (
                    maiorCategoriaDespesa &&
                    maiorCategoriaDespesa.percentual < 60
                  ) {
                    score += 15;
                    insights.push({
                      type: "warning",
                      text: "Concentração moderada de gastos",
                    });
                  } else {
                    score += 5;
                    insights.push({
                      type: "danger",
                      text: "Alta concentração em uma categoria",
                    });
                  }

                  // Constância (0-20 pontos)
                  const transacoesRecorrentes = transactions.filter(
                    (t) => t.recorrente
                  ).length;
                  const percentualRecorrente =
                    (transacoesRecorrentes / transactions.length) * 100;
                  if (percentualRecorrente >= 50) {
                    score += 20;
                    insights.push({
                      type: "success",
                      text: "Alta previsibilidade financeira",
                    });
                  } else if (percentualRecorrente >= 25) {
                    score += 12;
                    insights.push({
                      type: "warning",
                      text: "Previsibilidade moderada",
                    });
                  } else {
                    score += 5;
                    insights.push({
                      type: "danger",
                      text: "Baixa previsibilidade",
                    });
                  }

                  const scoreColor =
                    score >= 80
                      ? "text-emerald-600"
                      : score >= 60
                      ? "text-blue-600"
                      : score >= 40
                      ? "text-amber-600"
                      : "text-red-600";
                  const scoreBg =
                    score >= 80
                      ? "bg-emerald-50"
                      : score >= 60
                      ? "bg-blue-50"
                      : score >= 40
                      ? "bg-amber-50"
                      : "bg-red-50";

                  return (
                    <div className="space-y-4">
                      <div className={`text-center p-6 rounded-lg ${scoreBg}`}>
                        <div
                          className={`text-4xl font-bold ${scoreColor} mb-2`}
                        >
                          {score}/100
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {score >= 80
                            ? "Excelente Saúde Financeira"
                            : score >= 60
                            ? "Boa Saúde Financeira"
                            : score >= 40
                            ? "Saúde Financeira Regular"
                            : "Necessita Melhorias"}
                        </div>
                      </div>

                      <div className="space-y-2">
                        {insights.map((insight, idx) => (
                          <div
                            key={idx}
                            className={`flex items-start gap-2 p-2 rounded text-xs ${
                              insight.type === "success"
                                ? "bg-emerald-50 text-emerald-700"
                                : insight.type === "warning"
                                ? "bg-amber-50 text-amber-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            <div
                              className={`w-1.5 h-1.5 rounded-full mt-1 ${
                                insight.type === "success"
                                  ? "bg-emerald-500"
                                  : insight.type === "warning"
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                              }`}
                            />
                            <span>{insight.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
            {/* Recomendações personalizadas */}
            <div className="bg-white rounded-lg border border-border/60">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Recomendações Personalizadas</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Dicas baseadas na sua situação financeira atual
                </p>
              </div>
              <div className="p-4 space-y-3">
                {(() => {
                  const recomendacoes = [];

                  // Economia baixa
                  if (summary.economiaPercentual < 10) {
                    recomendacoes.push({
                      tipo: "priority",
                      titulo: "Aumentar Taxa de Economia",
                      descricao: `Meta: alcançar 10-20% de economia. Atualmente: ${summary.economiaPercentual.toFixed(
                        1
                      )}%`,
                      acao: "Revisar gastos não essenciais",
                    });
                  }

                  // Categoria dominante
                  if (categoryData.despesas[0]?.percentual > 50) {
                    recomendacoes.push({
                      tipo: "warning",
                      titulo: "Diversificar Gastos",
                      descricao: `${
                        categoryData.despesas[0].categoria
                      } representa ${categoryData.despesas[0].percentual.toFixed(
                        1
                      )}% dos gastos`,
                      acao: "Avaliar se é possível reduzir esta categoria",
                    });
                  }

                  // Sem metas
                  if (savingsGoals.length === 0) {
                    recomendacoes.push({
                      tipo: "suggestion",
                      titulo: "Definir Metas de Poupança",
                      descricao:
                        "Ter objetivos claros ajuda a manter disciplina financeira",
                      acao: "Criar pelo menos uma meta de poupança",
                    });
                  }

                  // Poucas receitas recorrentes
                  const receitasRecorrentes = transactions.filter(
                    (t) => t.tipo === "receita" && t.recorrente
                  ).length;
                  if (receitasRecorrentes < 2) {
                    recomendacoes.push({
                      tipo: "suggestion",
                      titulo: "Aumentar Receitas Recorrentes",
                      descricao:
                        "Receitas previsíveis oferecem mais segurança financeira",
                      acao: "Buscar fontes de renda passiva ou complementar",
                    });
                  }

                  // Projeção negativa
                  if (summary.projecaoMensal < 0) {
                    recomendacoes.push({
                      tipo: "priority",
                      titulo: "Reverter Tendência Negativa",
                      descricao: `Projeção indica déficit de ${formatCurrency(
                        Math.abs(summary.projecaoMensal)
                      )} em 30 dias`,
                      acao: "Cortar gastos ou aumentar receitas urgentemente",
                    });
                  }

                  // Baixa frequência de transações
                  if (summary.transacoesPorDia < 0.5) {
                    recomendacoes.push({
                      tipo: "info",
                      titulo: "Aumentar Controle Financeiro",
                      descricao:
                        "Poucas transações registradas podem indicar falta de controle",
                      acao: "Registrar todas as movimentações financeiras",
                    });
                  }

                  // Metas próximas do vencimento
                  const metasVencendo = savingsGoals.filter((g) => {
                    if (!g.prazo) return false;
                    try {
                      const prazoDate = new Date(g.prazo);
                      const hoje = new Date();
                      const em30Dias = new Date(
                        Date.now() + 30 * 24 * 60 * 60 * 1000
                      );
                      return (
                        prazoDate <= em30Dias &&
                        prazoDate > hoje &&
                        g.progresso < 90
                      );
                    } catch {
                      return false;
                    }
                  });
                  if (metasVencendo.length > 0) {
                    recomendacoes.push({
                      tipo: "warning",
                      titulo: "Metas Próximas do Prazo",
                      descricao: `${metasVencendo.length} meta(s) vencem em breve e estão incompletas`,
                      acao: "Intensificar poupança ou ajustar prazo",
                    });
                  }

                  if (recomendacoes.length === 0) {
                    recomendacoes.push({
                      tipo: "success",
                      titulo: "Parabéns!",
                      descricao: "Suas finanças estão bem equilibradas",
                      acao: "Continue mantendo os bons hábitos",
                    });
                  }

                  return recomendacoes.slice(0, 6).map((rec, idx) => (
                    <div
                      key={idx}
                      className={`p-3 rounded-lg border-l-4 ${
                        rec.tipo === "priority"
                          ? "bg-red-50 border-red-500"
                          : rec.tipo === "warning"
                          ? "bg-amber-50 border-amber-500"
                          : rec.tipo === "suggestion"
                          ? "bg-blue-50 border-blue-500"
                          : rec.tipo === "success"
                          ? "bg-emerald-50 border-emerald-500"
                          : "bg-gray-50 border-gray-500"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h4
                            className={`text-sm font-medium ${
                              rec.tipo === "priority"
                                ? "text-red-800"
                                : rec.tipo === "warning"
                                ? "text-amber-800"
                                : rec.tipo === "suggestion"
                                ? "text-blue-800"
                                : rec.tipo === "success"
                                ? "text-emerald-800"
                                : "text-gray-800"
                            }`}
                          >
                            {rec.titulo}
                          </h4>
                          <p
                            className={`text-xs mt-1 ${
                              rec.tipo === "priority"
                                ? "text-red-600"
                                : rec.tipo === "warning"
                                ? "text-amber-600"
                                : rec.tipo === "suggestion"
                                ? "text-blue-600"
                                : rec.tipo === "success"
                                ? "text-emerald-600"
                                : "text-gray-600"
                            }`}
                          >
                            {rec.descricao}
                          </p>
                          <p
                            className={`text-xs mt-2 font-medium ${
                              rec.tipo === "priority"
                                ? "text-red-700"
                                : rec.tipo === "warning"
                                ? "text-amber-700"
                                : rec.tipo === "suggestion"
                                ? "text-blue-700"
                                : rec.tipo === "success"
                                ? "text-emerald-700"
                                : "text-gray-700"
                            }`}
                          >
                            💡 {rec.acao}
                          </p>
                        </div>
                        <ChevronRight
                          className={`h-4 w-4 ${
                            rec.tipo === "priority"
                              ? "text-red-400"
                              : rec.tipo === "warning"
                              ? "text-amber-400"
                              : rec.tipo === "suggestion"
                              ? "text-blue-400"
                              : rec.tipo === "success"
                              ? "text-emerald-400"
                              : "text-gray-400"
                          }`}
                        />
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
            {/* Análise de comportamento */}
            <div className="bg-white rounded-lg border border-border/60">
              <div className="p-4 border-b border-border/30">
                <h3 className="font-semibold">Análise de Comportamento</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Padrões identificados no seu comportamento financeiro
                </p>
              </div>
              <div className="p-4 space-y-4">
                {/* Frequência de gastos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                      Frequência de Transações
                    </h4>
                    <div className="space-y-1 text-xs text-blue-700">
                      <div>
                        • {summary.transacoesPorDia.toFixed(1)} transações por
                        dia
                      </div>
                      <div>
                        • Valor médio:{" "}
                        {showValues
                          ? formatCurrency(summary.mediaTransacao)
                          : "••••"}
                      </div>
                      <div>
                        •{" "}
                        {(
                          (transactions.filter((t) => t.recorrente).length /
                            transactions.length) *
                          100
                        ).toFixed(0)}
                        % são recorrentes
                      </div>
                    </div>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="text-sm font-medium text-purple-800 mb-2">
                      Categorias Preferidas
                    </h4>
                    <div className="space-y-1 text-xs text-purple-700">
                      <div>
                        • Principal despesa:{" "}
                        {summary.categoriasPrincipais.despesa}
                      </div>
                      <div>
                        • Principal receita:{" "}
                        {summary.categoriasPrincipais.receita}
                      </div>
                      <div>
                        •{" "}
                        {categoryData.despesas.length +
                          categoryData.receitas.length}{" "}
                        categorias ativas
                      </div>
                    </div>
                  </div>
                </div>

                {/* Tendências sazonais */}
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-800 mb-2">
                    Observações Gerais
                  </h4>
                  <div className="text-xs text-gray-700 space-y-1">
                    {summary.economiaPercentual > 0 && (
                      <div>✅ Consegue economizar consistentemente</div>
                    )}
                    {summary.totalTransacoes > 50 && (
                      <div>📊 Mantém controle detalhado das finanças</div>
                    )}
                    {transactions.filter((t) => t.recorrente).length > 5 && (
                      <div>
                        🎯 Possui bom planejamento de receitas/despesas fixas
                      </div>
                    )}
                    {categoryData.despesas.length > 5 && (
                      <div>🏷️ Utiliza categorização diversificada</div>
                    )}
                    {monthlyEvolution.length > 3 &&
                      monthlyEvolution.slice(-3).every((m) => m.saldo >= 0) && (
                        <div>📈 Mantém saldo positivo consistentemente</div>
                      )}
                    {savingsGoals.filter((g) => g.progresso >= 100).length >
                      0 && <div>🎯 Atinge suas metas de poupança</div>}
                  </div>
                </div>
              </div>
            </div>
            {/* Comparação com metas */}
            {savingsGoals.length > 0 && (
              <div className="bg-white rounded-lg border border-border/60">
                <div className="p-4 border-b border-border/30">
                  <h3 className="font-semibold">Progresso das Metas</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Acompanhamento detalhado das suas metas de poupança
                  </p>
                </div>
                <div className="p-4 space-y-4">
                  {savingsGoals.map((goal) => (
                    <div key={goal.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">
                            {goal.descricao}
                          </h4>
                          {goal.categoria && (
                            <span className="text-xs text-muted-foreground mt-1 block">
                              Categoria: {goal.categoria}
                            </span>
                          )}
                        </div>
                        <div className="text-right">
                          <span
                            className={`text-lg font-bold ${
                              goal.progresso >= 100
                                ? "text-emerald-600"
                                : goal.progresso >= 75
                                ? "text-blue-600"
                                : goal.progresso >= 50
                                ? "text-amber-600"
                                : "text-red-600"
                            }`}
                          >
                            {goal.progresso.toFixed(0)}%
                          </span>
                          {goal.prazo && (
                            <div className="text-xs text-muted-foreground mt-1">
                              {(() => {
                                try {
                                  const prazoDate = new Date(goal.prazo);
                                  const hoje = new Date();
                                  const diffTime =
                                    prazoDate.getTime() - hoje.getTime();
                                  const diffDays = Math.ceil(
                                    diffTime / (1000 * 60 * 60 * 24)
                                  );

                                  if (diffDays > 0) {
                                    return `${diffDays} dias restantes`;
                                  } else {
                                    return "Prazo vencido";
                                  }
                                } catch {
                                  return "Data inválida";
                                }
                              })()}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>
                            Atual:{" "}
                            {showValues
                              ? formatCurrency(goal.valor_atual)
                              : "••••"}
                          </span>
                          <span>
                            Meta:{" "}
                            {showValues
                              ? formatCurrency(goal.valor_objetivo)
                              : "••••"}
                          </span>
                        </div>

                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-500 ${
                              goal.progresso >= 100
                                ? "bg-emerald-500"
                                : goal.progresso >= 75
                                ? "bg-blue-500"
                                : goal.progresso >= 50
                                ? "bg-amber-500"
                                : "bg-red-500"
                            }`}
                            style={{
                              width: `${Math.min(goal.progresso, 100)}%`,
                            }}
                          />
                        </div>

                        <div className="text-xs text-muted-foreground">
                          {goal.progresso >= 100 ? (
                            <span className="text-emerald-600 font-medium">
                              🎉 Meta atingida!
                            </span>
                          ) : (
                            <span>
                              Faltam{" "}
                              {showValues
                                ? formatCurrency(
                                    goal.valor_objetivo - goal.valor_atual
                                  )
                                : "••••"}{" "}
                              para atingir a meta
                              {goal.prazo &&
                                new Date(goal.prazo) > new Date() && (
                                  <span className="ml-2">
                                    (≈{" "}
                                    {showValues
                                      ? formatCurrency(
                                          (goal.valor_objetivo -
                                            goal.valor_atual) /
                                            Math.max(
                                              1,
                                              Math.ceil(
                                                (new Date(
                                                  goal.prazo
                                                ).getTime() -
                                                  new Date().getTime()) /
                                                  (1000 * 60 * 60 * 24)
                                              )
                                            )
                                        )
                                      : "••••"}
                                    /dia)
                                  </span>
                                )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
