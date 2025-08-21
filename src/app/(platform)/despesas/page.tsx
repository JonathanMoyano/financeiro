"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  TrendingDown,
  TrendingUp,
  Edit2,
  Trash2,
  Calendar,
  DollarSign,
  Tag,
  Eye,
  EyeOff,
  RefreshCw,
  Download,
  Loader2,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Interfaces
interface Transacao {
  id: string;
  user_id: string;
  descricao: string;
  valor: number;
  tipo: "receita" | "despesa";
  categoria: string;
  data: string;
  observacoes?: string;
  metodo_pagamento?: string;
  recorrente?: boolean;
  favorito?: boolean;
  created_at: string;
  updated_at: string;
}

interface NovaTransacao {
  descricao: string;
  valor: string;
  tipo: "receita" | "despesa";
  categoria: string;
  data: string;
  observacoes: string;
  metodo_pagamento: string;
  recorrente: boolean;
  favorito: boolean;
}

interface Categoria {
  nome: string;
  tipo: "receita" | "despesa";
  icone: string;
  cor: string;
}

interface Filtros {
  tipo: "todos" | "receita" | "despesa";
  categoria: string;
  dataInicio: string;
  dataFim: string;
  valorMin: string;
  valorMax: string;
  busca: string;
}

export default function TransacoesPage() {
  const [mounted, setMounted] = useState(false);
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [todasTransacoes, setTodasTransacoes] = useState<Transacao[]>([]); // Para cálculo dos totais
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [loading, setLoading] = useState(false);
  const [showValues, setShowValues] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Sistema de notificações
  const [notifications, setNotifications] = useState<
    Array<{
      id: string;
      message: string;
      type: "warning" | "error" | "info";
      createdAt: Date;
    }>
  >([]);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  // Filtros
  const [filtros, setFiltros] = useState<Filtros>({
    tipo: "todos",
    categoria: "",
    dataInicio: "",
    dataFim: "",
    valorMin: "",
    valorMax: "",
    busca: "",
  });

  // Formulário de nova transação
  const [novaTransacao, setNovaTransacao] = useState<NovaTransacao>({
    descricao: "",
    valor: "",
    tipo: "despesa",
    categoria: "",
    data: new Date().toISOString().split("T")[0],
    observacoes: "",
    metodo_pagamento: "",
    recorrente: false,
    favorito: false,
  });

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const supabase = createClient();

  // Categorias padrão
  const categoriasDefault: Categoria[] = [
    // Categorias de Despesa
    { nome: "Alimentação", tipo: "despesa", icone: "🍽️", cor: "#ef4444" },
    { nome: "Transporte", tipo: "despesa", icone: "🚗", cor: "#3b82f6" },
    { nome: "Saúde", tipo: "despesa", icone: "🏥", cor: "#10b981" },
    { nome: "Educação", tipo: "despesa", icone: "📚", cor: "#8b5cf6" },
    { nome: "Lazer", tipo: "despesa", icone: "🎉", cor: "#f59e0b" },
    { nome: "Casa", tipo: "despesa", icone: "🏠", cor: "#06b6d4" },
    { nome: "Roupas", tipo: "despesa", icone: "👕", cor: "#84cc16" },
    { nome: "Outros", tipo: "despesa", icone: "📦", cor: "#6b7280" },

    // Categorias de Receita
    { nome: "Salário", tipo: "receita", icone: "💼", cor: "#10b981" },
    { nome: "Freelance", tipo: "receita", icone: "💻", cor: "#3b82f6" },
    { nome: "Investimentos", tipo: "receita", icone: "📈", cor: "#8b5cf6" },
    { nome: "Vendas", tipo: "receita", icone: "🛒", cor: "#f59e0b" },
    { nome: "Outros", tipo: "receita", icone: "💰", cor: "#6b7280" },
  ];

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
      loadCategorias();
      loadTransacoes();
    }
  }, [user, authLoading, mounted, currentPage, filtros]);

  const loadCategorias = async () => {
    try {
      setCategorias(categoriasDefault);
    } catch (error) {
      console.error("❌ Erro ao carregar categorias:", error);
      setCategorias(categoriasDefault);
    }
  };

  const getCategoriasPorTipo = (tipo: "receita" | "despesa"): Categoria[] => {
    return categorias.filter((cat) => cat.tipo === tipo);
  };

  // Função para verificar vencimentos
  const checkVencimentos = async () => {
    if (!user) return;

    try {
      const hoje = new Date();
      const em3Dias = new Date(hoje);
      em3Dias.setDate(hoje.getDate() + 3);

      const hojeStr = hoje.toISOString().split("T")[0];
      const em3DiasStr = em3Dias.toISOString().split("T")[0];

      const { data: despesasVencendo, error } = await supabase
        .from("despesas")
        .select("*")
        .eq("user_id", user.id)
        .gte("data", hojeStr)
        .lte("data", em3DiasStr)
        .order("data", { ascending: true });

      if (error) {
        console.error("Erro ao verificar vencimentos:", error);
        return;
      }

      const novasNotificacoes: Array<{
        id: string;
        message: string;
        type: "warning" | "error" | "info";
        createdAt: Date;
      }> = [];

      despesasVencendo?.forEach((despesa) => {
        const dataVencimento = new Date(despesa.data);
        const diffTime = dataVencimento.getTime() - hoje.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message = "";
        let type: "warning" | "error" | "info" = "info";

        if (diffDays === 0) {
          message = `💰 "${despesa.descricao}" vence HOJE! Valor: R$ ${parseFloat(despesa.valor).toFixed(2).replace(".", ",")}`;
          type = "error";
        } else if (diffDays === 1) {
          message = `⚠️ "${despesa.descricao}" vence AMANHÃ! Valor: R$ ${parseFloat(despesa.valor).toFixed(2).replace(".", ",")}`;
          type = "warning";
        } else if (diffDays <= 3) {
          message = `📅 "${despesa.descricao}" vence em ${diffDays} dias. Valor: R$ ${parseFloat(despesa.valor).toFixed(2).replace(".", ",")}`;
          type = "info";
        }

        if (message) {
          novasNotificacoes.push({
            id: `venc-${despesa.id}`,
            message,
            type,
            createdAt: new Date(),
          });
        }
      });

      setNotifications((prev) => {
        const existingIds = prev.map((n) => n.id);
        const newNotifications = novasNotificacoes.filter((n) => !existingIds.includes(n.id));
        return [...prev, ...newNotifications];
      });
    } catch (error) {
      console.error("Erro ao verificar vencimentos:", error);
    }
  };

  const removeNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Auto-remover notificações antigas
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      setNotifications((prev) =>
        prev.filter((n) => {
          const diffMinutes = (now.getTime() - n.createdAt.getTime()) / (1000 * 60);
          return diffMinutes < 5;
        })
      );
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Verificar vencimentos periodicamente
  useEffect(() => {
    if (mounted && user && !authLoading) {
      checkVencimentos();
      const interval = setInterval(checkVencimentos, 300000);
      return () => clearInterval(interval);
    }
  }, [user, authLoading, mounted]);

  const loadTransacoes = async () => {
    if (!user) return;

    setLoading(true);
    try {
      console.log("📋 Carregando transações...");

      const todasTransacoesCarregadas: Transacao[] = [];

      // Buscar despesas
      if (filtros.tipo === "todos" || filtros.tipo === "despesa") {
        try {
          let queryDespesas = supabase
            .from("despesas")
            .select("*")
            .eq("user_id", user.id);

          // Aplicar filtros para despesas
          if (filtros.categoria) {
            queryDespesas = queryDespesas.eq("categoria", filtros.categoria);
          }
          if (filtros.dataInicio) {
            queryDespesas = queryDespesas.gte("data", filtros.dataInicio);
          }
          if (filtros.dataFim) {
            queryDespesas = queryDespesas.lte("data", filtros.dataFim);
          }
          if (filtros.valorMin) {
            queryDespesas = queryDespesas.gte("valor", parseFloat(filtros.valorMin));
          }
          if (filtros.valorMax) {
            queryDespesas = queryDespesas.lte("valor", parseFloat(filtros.valorMax));
          }
          if (filtros.busca) {
            queryDespesas = queryDespesas.or(
              `descricao.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`
            );
          }

          const { data: despesas, error: despesasError } = await queryDespesas.order("created_at", { ascending: false });

          if (!despesasError && despesas) {
            despesas.forEach((despesa) => {
              todasTransacoesCarregadas.push({
                ...despesa,
                tipo: "despesa" as const,
                valor: parseFloat(despesa.valor) || 0,
                recorrente: despesa.recorrente || false,
                favorito: despesa.favorito || false,
              });
            });
          } else if (despesasError) {
            console.error("Erro ao buscar despesas:", despesasError);
          }
        } catch (error) {
          console.error("Erro ao processar despesas:", error);
        }
      }

      // Buscar receitas
      if (filtros.tipo === "todos" || filtros.tipo === "receita") {
        try {
          let queryReceitas = supabase
            .from("receitas")
            .select("*")
            .eq("user_id", user.id);

          // Aplicar filtros para receitas
          if (filtros.categoria) {
            queryReceitas = queryReceitas.eq("categoria", filtros.categoria);
          }
          if (filtros.dataInicio) {
            queryReceitas = queryReceitas.gte("data", filtros.dataInicio);
          }
          if (filtros.dataFim) {
            queryReceitas = queryReceitas.lte("data", filtros.dataFim);
          }
          if (filtros.valorMin) {
            queryReceitas = queryReceitas.gte("valor", parseFloat(filtros.valorMin));
          }
          if (filtros.valorMax) {
            queryReceitas = queryReceitas.lte("valor", parseFloat(filtros.valorMax));
          }
          if (filtros.busca) {
            queryReceitas = queryReceitas.or(
              `descricao.ilike.%${filtros.busca}%,observacoes.ilike.%${filtros.busca}%`
            );
          }

          const { data: receitas, error: receitasError } = await queryReceitas.order("created_at", { ascending: false });

          if (!receitasError && receitas) {
            receitas.forEach((receita) => {
              todasTransacoesCarregadas.push({
                ...receita,
                tipo: "receita" as const,
                valor: parseFloat(receita.valor) || 0,
                recorrente: receita.recorrente || false,
                favorito: receita.favorito || false,
              });
            });
          } else if (receitasError) {
            console.error("Erro ao buscar receitas:", receitasError);
          }
        } catch (error) {
          console.error("Erro ao processar receitas:", error);
        }
      }

      // Ordenar todas as transações por data de criação
      todasTransacoesCarregadas.sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      // Salvar todas as transações para cálculo dos totais
      setTodasTransacoes(todasTransacoesCarregadas);

      // Aplicar paginação
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const transacoesPaginadas = todasTransacoesCarregadas.slice(startIndex, endIndex);

      setTransacoes(transacoesPaginadas);
      setTotalPages(Math.ceil(todasTransacoesCarregadas.length / itemsPerPage));

      console.log("✅ Transações carregadas:", transacoesPaginadas.length, "de", todasTransacoesCarregadas.length);
    } catch (error) {
      console.error("❌ Erro ao carregar transações:", error);
      setError("Erro ao carregar transações");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      const valor = parseFloat(novaTransacao.valor.replace(/[^\d,]/g, "").replace(",", "."));
      if (isNaN(valor) || valor <= 0) {
        setError("Por favor, insira um valor válido.");
        return;
      }

      if (!novaTransacao.categoria) {
        setError("Por favor, selecione uma categoria.");
        return;
      }

      const transacaoData = {
        user_id: user.id,
        descricao: novaTransacao.descricao,
        valor: valor,
        categoria: novaTransacao.categoria,
        data: novaTransacao.data,
        observacoes: novaTransacao.observacoes || null,
        metodo_pagamento: novaTransacao.metodo_pagamento || null,
        recorrente: novaTransacao.recorrente,
        favorito: novaTransacao.favorito,
      };

      const tabela = novaTransacao.tipo === "receita" ? "receitas" : "despesas";

      let result;
      if (editingId) {
        result = await supabase
          .from(tabela)
          .update(transacaoData)
          .eq("id", editingId)
          .eq("user_id", user.id);
      } else {
        result = await supabase.from(tabela).insert(transacaoData);
      }

      if (result.error) throw result.error;

      setNovaTransacao({
        descricao: "",
        valor: "",
        tipo: "despesa",
        categoria: "",
        data: new Date().toISOString().split("T")[0],
        observacoes: "",
        metodo_pagamento: "",
        recorrente: false,
        favorito: false,
      });

      setShowModal(false);
      setEditingId(null);
      await loadTransacoes();

      setSuccess(editingId ? "Transação atualizada com sucesso!" : "Transação adicionada com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error: any) {
      console.error("❌ Erro ao salvar transação:", error);
      setError("Erro ao salvar transação. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, tipo: "receita" | "despesa") => {
    if (!user || !confirm("Tem certeza que deseja excluir esta transação?")) return;

    try {
      setLoading(true);
      const tabela = tipo === "receita" ? "receitas" : "despesas";

      const { error } = await supabase
        .from(tabela)
        .delete()
        .eq("id", id)
        .eq("user_id", user.id);

      if (error) throw error;

      await loadTransacoes();
      setSuccess("Transação excluída com sucesso!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error("❌ Erro ao excluir transação:", error);
      setError("Erro ao excluir transação");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (transacao: Transacao) => {
    setNovaTransacao({
      descricao: transacao.descricao,
      valor: transacao.valor.toString(),
      tipo: transacao.tipo,
      categoria: transacao.categoria,
      data: transacao.data,
      observacoes: transacao.observacoes || "",
      metodo_pagamento: transacao.metodo_pagamento || "",
      recorrente: transacao.recorrente || false,
      favorito: transacao.favorito || false,
    });
    setEditingId(transacao.id);
    setShowModal(true);
  };

  const resetFiltros = () => {
    setFiltros({
      tipo: "todos",
      categoria: "",
      dataInicio: "",
      dataFim: "",
      valorMin: "",
      valorMax: "",
      busca: "",
    });
    setCurrentPage(1);
  };

  const formatCurrency = (value: number) => {
    if (!showValues) return "R$ ••••••";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const exportToCSV = () => {
    const headers = ["Data", "Tipo", "Descrição", "Categoria", "Valor", "Observações"];
    const rows = transacoes.map((t) => [
      new Date(t.data).toLocaleDateString("pt-BR"),
      t.tipo === "receita" ? "Receita" : "Despesa",
      t.descricao,
      t.categoria,
      t.valor.toFixed(2),
      t.observacoes || "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  if (!mounted || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Calcular totais baseado em TODAS as transações carregadas
  const totalReceitas = todasTransacoes
    .filter((t) => t.tipo === "receita")
    .reduce((sum, t) => sum + t.valor, 0);

  const totalDespesas = todasTransacoes
    .filter((t) => t.tipo === "despesa")
    .reduce((sum, t) => sum + t.valor, 0);

  const saldo = totalReceitas - totalDespesas;

  return (
    <div className="space-y-4 md:space-y-6 max-w-full overflow-hidden">
      {/* Alertas */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-4 w-4 md:h-5 md:w-5 text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-red-800 font-medium text-sm md:text-base">Erro</h4>
              <p className="text-red-700 text-xs md:text-sm">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="flex-shrink-0">
              <X className="h-4 w-4 text-red-500" />
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-4 w-4 md:h-5 md:w-5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <h4 className="text-green-800 font-medium text-sm md:text-base">Sucesso</h4>
              <p className="text-green-700 text-xs md:text-sm">{success}</p>
            </div>
            <button onClick={() => setSuccess(null)} className="flex-shrink-0">
              <X className="h-4 w-4 text-green-500" />
            </button>
          </div>
        </div>
      )}

      {/* Notificações de Vencimento */}
      {notifications.length > 0 && (
        <div className="space-y-2 md:space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 md:p-4 rounded-lg border-l-4 ${
                notification.type === "error"
                  ? "bg-red-50 border-red-500 text-red-800"
                  : notification.type === "warning"
                  ? "bg-yellow-50 border-yellow-500 text-yellow-800"
                  : "bg-blue-50 border-blue-500 text-blue-800"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
                  {notification.type === "error" && <AlertCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                  {notification.type === "warning" && <Calendar className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                  {notification.type === "info" && <CheckCircle className="h-4 w-4 md:h-5 md:w-5 flex-shrink-0" />}
                  <p className="font-medium text-xs md:text-sm">{notification.message}</p>
                </div>
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="hover:opacity-70 transition-opacity flex-shrink-0"
                >
                  <X className="h-3 w-3 md:h-4 md:w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col space-y-3 md:space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 md:gap-4">
          <div className="min-w-0 text-center lg:text-left">
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
              Transações Financeiras
            </h1>
            <p className="text-sm md:text-base text-muted-foreground">
              Gerencie suas receitas e despesas de forma organizada
            </p>
          </div>

          <div className="flex items-center justify-center lg:justify-end gap-2 md:gap-3">
            <button
              onClick={() => setShowValues(!showValues)}
              className="p-2 md:p-3 rounded-lg md:rounded-xl bg-card hover:bg-accent border transition-colors"
              title={showValues ? "Ocultar valores" : "Mostrar valores"}
            >
              {showValues ? (
                <Eye className="h-4 w-4 md:h-5 md:w-5" />
              ) : (
                <EyeOff className="h-4 w-4 md:h-5 md:w-5" />
              )}
            </button>

            <button
              onClick={exportToCSV}
              className="p-2 md:p-3 rounded-lg md:rounded-xl bg-card hover:bg-accent border transition-colors"
              title="Exportar para CSV"
            >
              <Download className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <button
              onClick={loadTransacoes}
              className="p-2 md:p-3 rounded-lg md:rounded-xl bg-card hover:bg-accent border transition-colors"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4 md:h-5 md:w-5" />
            </button>

            <button
              onClick={() => setShowModal(true)}
              className="bg-primary text-primary-foreground px-3 md:px-6 py-2 md:py-3 rounded-lg md:rounded-xl font-medium hover:bg-primary/90 transition-colors flex items-center gap-2 text-sm md:text-base"
            >
              <Plus className="h-4 w-4 md:h-5 md:w-5" />
              <span className="hidden sm:inline">Nova Transação</span>
              <span className="sm:hidden">Nova</span>
            </button>
          </div>
        </div>
      </div>

      {/* Cards de resumo - RESPONSIVOS E CORRIGIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
        <div className="bg-card rounded-lg md:rounded-xl p-4 md:p-6 border">
          <div className="flex items-center justify-between">
            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-emerald-500/10 flex-shrink-0">
              <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-emerald-500" />
            </div>
            <div className="text-right min-w-0 flex-1 ml-3">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">
                Total Receitas
              </p>
              <p className="text-base md:text-2xl font-bold text-emerald-500 break-words">
                {formatCurrency(totalReceitas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg md:rounded-xl p-4 md:p-6 border">
          <div className="flex items-center justify-between">
            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-red-500/10 flex-shrink-0">
              <TrendingDown className="h-5 w-5 md:h-6 md:w-6 text-red-500" />
            </div>
            <div className="text-right min-w-0 flex-1 ml-3">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">
                Total Despesas
              </p>
              <p className="text-base md:text-2xl font-bold text-red-500 break-words">
                {formatCurrency(totalDespesas)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card rounded-lg md:rounded-xl p-4 md:p-6 border">
          <div className="flex items-center justify-between">
            <div className={`p-2 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
              saldo >= 0 ? "bg-emerald-500/10" : "bg-red-500/10"
            }`}>
              <DollarSign className={`h-5 w-5 md:h-6 md:w-6 ${
                saldo >= 0 ? "text-emerald-500" : "text-red-500"
              }`} />
            </div>
            <div className="text-right min-w-0 flex-1 ml-3">
              <p className="text-xs md:text-sm text-muted-foreground mb-1">Saldo</p>
              <p className={`text-base md:text-2xl font-bold break-words ${
                saldo >= 0 ? "text-emerald-500" : "text-red-500"
              }`}>
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros e busca - RESPONSIVOS */}
      <div className="bg-card rounded-lg md:rounded-xl border p-3 md:p-6">
        <div className="flex flex-col gap-3 md:gap-4">
          {/* Primeira linha - Busca e filtros principais */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
            {/* Busca */}
            <div className="flex-1 min-w-0">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar por descrição..."
                  value={filtros.busca}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, busca: e.target.value }))
                  }
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
            </div>

            {/* Filtro por tipo */}
            <select
              value={filtros.tipo}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, tipo: e.target.value as any }))
              }
              className="px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-w-0 sm:w-auto"
            >
              <option value="todos">Todos os tipos</option>
              <option value="receita">Receitas</option>
              <option value="despesa">Despesas</option>
            </select>

            {/* Filtro por categoria */}
            <select
              value={filtros.categoria}
              onChange={(e) =>
                setFiltros((prev) => ({ ...prev, categoria: e.target.value }))
              }
              className="px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm min-w-0 sm:w-auto"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((cat, index) => (
                <option key={`${cat.nome}-${index}`} value={cat.nome}>
                  {cat.icone} {cat.nome}
                </option>
              ))}
            </select>
          </div>

          {/* Segunda linha - Botões de ação */}
          <div className="flex flex-wrap items-center gap-2 md:gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-3 md:px-4 py-2 border border-input rounded-lg bg-background hover:bg-accent transition-colors flex items-center gap-2 text-sm"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>

            {(filtros.categoria ||
              filtros.dataInicio ||
              filtros.dataFim ||
              filtros.valorMin ||
              filtros.valorMax ||
              filtros.busca) && (
              <button
                onClick={resetFiltros}
                className="px-3 md:px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg hover:bg-red-100 transition-colors text-sm"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Filtros avançados */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pt-3 md:pt-4 border-t">
              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">
                  Data início
                </label>
                <input
                  type="date"
                  value={filtros.dataInicio}
                  onChange={(e) =>
                    setFiltros((prev) => ({
                      ...prev,
                      dataInicio: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">Data fim</label>
                <input
                  type="date"
                  value={filtros.dataFim}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, dataFim: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">
                  Valor mínimo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filtros.valorMin}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, valorMin: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs md:text-sm font-medium mb-1">
                  Valor máximo
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="0,00"
                  value={filtros.valorMax}
                  onChange={(e) =>
                    setFiltros((prev) => ({ ...prev, valorMax: e.target.value }))
                  }
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Lista de transações - RESPONSIVA */}
      <div className="bg-card rounded-lg md:rounded-xl border">
        <div className="p-3 md:p-6 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h3 className="text-sm md:text-lg font-semibold">
              Transações ({todasTransacoes.length})
            </h3>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                  className="p-2 border border-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <span className="text-xs md:text-sm text-muted-foreground px-2">
                  Página {currentPage} de {totalPages}
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="p-2 border border-input rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent transition-colors"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="p-3 md:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8 md:py-12">
              <Loader2 className="h-6 w-6 md:h-8 md:w-8 animate-spin text-primary" />
              <span className="ml-3 text-sm md:text-base text-muted-foreground">
                Carregando transações...
              </span>
            </div>
          ) : transacoes.length > 0 ? (
            <div className="space-y-3 md:space-y-4">
              {transacoes.map((transacao) => (
                <div
                  key={transacao.id}
                  className="flex items-center justify-between p-3 md:p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 md:gap-4 flex-1 min-w-0">
                    <div
                      className={`p-2 md:p-3 rounded-lg md:rounded-xl flex-shrink-0 ${
                        transacao.tipo === "receita"
                          ? "bg-emerald-500/10"
                          : "bg-red-500/10"
                      }`}
                    >
                      {transacao.tipo === "receita" ? (
                        <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                      ) : (
                        <TrendingDown className="h-4 w-4 md:h-5 md:w-5 text-red-500" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-sm md:text-base truncate">
                          {transacao.descricao}
                        </h4>
                        {transacao.favorito && (
                          <span className="text-yellow-500 flex-shrink-0">⭐</span>
                        )}
                        {transacao.recorrente && (
                          <span className="text-blue-500 text-xs bg-blue-50 px-2 py-1 rounded flex-shrink-0">
                            Recorrente
                          </span>
                        )}
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{transacao.categoria}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 flex-shrink-0" />
                          {new Date(transacao.data).toLocaleDateString("pt-BR")}
                        </span>
                        {transacao.metodo_pagamento && (
                          <span className="truncate">{transacao.metodo_pagamento}</span>
                        )}
                      </div>
                      {transacao.observacoes && (
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {transacao.observacoes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm md:text-lg font-semibold block ${
                          transacao.tipo === "receita"
                            ? "text-emerald-500"
                            : "text-red-500"
                        }`}
                      >
                        {transacao.tipo === "receita" ? "+" : "-"}
                        {formatCurrency(transacao.valor)}
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {new Date(transacao.created_at).toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-1">
                      <button
                        onClick={() => handleEdit(transacao)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>

                      <button
                        onClick={() =>
                          handleDelete(transacao.id, transacao.tipo)
                        }
                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 md:py-12">
              <DollarSign className="h-8 w-8 md:h-12 md:w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-sm md:text-base text-muted-foreground mb-2">
                Nenhuma transação encontrada
              </p>
              <p className="text-xs md:text-sm text-muted-foreground/70 mb-3 md:mb-4">
                {Object.values(filtros).some((f) => f)
                  ? "Tente ajustar os filtros para encontrar suas transações"
                  : "Comece adicionando sua primeira transação!"}
              </p>
              <button
                onClick={() => setShowModal(true)}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                Adicionar Transação
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Modal de Nova/Editar Transação */}
      {showModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm overflow-y-auto h-full w-full z-50 p-4">
          <div className="relative top-4 md:top-10 mx-auto border w-full max-w-2xl shadow-lg rounded-lg md:rounded-xl bg-card my-8">
            <div className="flex items-center justify-between p-4 md:p-6 border-b">
              <h3 className="text-lg md:text-xl font-semibold">
                {editingId ? "Editar Transação" : "Nova Transação"}
              </h3>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingId(null);
                  setNovaTransacao({
                    descricao: "",
                    valor: "",
                    tipo: "despesa",
                    categoria: "",
                    data: new Date().toISOString().split("T")[0],
                    observacoes: "",
                    metodo_pagamento: "",
                    recorrente: false,
                    favorito: false,
                  });
                }}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 md:space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Tipo */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Tipo *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setNovaTransacao((prev) => ({
                          ...prev,
                          tipo: "receita",
                          categoria: "",
                        }))
                      }
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm ${
                        novaTransacao.tipo === "receita"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      <TrendingUp className="h-4 w-4" />
                      Receita
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setNovaTransacao((prev) => ({
                          ...prev,
                          tipo: "despesa",
                          categoria: "",
                        }))
                      }
                      className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 text-sm ${
                        novaTransacao.tipo === "despesa"
                          ? "bg-red-50 border-red-200 text-red-700"
                          : "border-input hover:bg-accent"
                      }`}
                    >
                      <TrendingDown className="h-4 w-4" />
                      Despesa
                    </button>
                  </div>
                </div>

                {/* Valor */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Valor *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground text-sm">
                      R$
                    </span>
                    <input
                      type="text"
                      required
                      className="w-full pl-12 pr-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                      value={novaTransacao.valor}
                      onChange={(e) => {
                        let value = e.target.value;
                        const numbersOnly = value.replace(/\D/g, "");

                        if (numbersOnly === "") {
                          setNovaTransacao((prev) => ({ ...prev, valor: "" }));
                          return;
                        }

                        const numericValue = parseInt(numbersOnly, 10);
                        const realValue = numericValue / 100;
                        const formatted = realValue.toLocaleString("pt-BR", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        });

                        setNovaTransacao((prev) => ({ ...prev, valor: formatted }));
                      }}
                      onFocus={(e) => {
                        if (!novaTransacao.valor) {
                          setNovaTransacao((prev) => ({ ...prev, valor: "0,00" }));
                        }
                      }}
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Digite apenas números. Ex: 8000 = R$ 80,00
                  </p>
                </div>
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Descrição *
                </label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={novaTransacao.descricao}
                  onChange={(e) =>
                    setNovaTransacao((prev) => ({
                      ...prev,
                      descricao: e.target.value,
                    }))
                  }
                  placeholder="Ex: Compra no supermercado"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Categoria *
                  </label>
                  <select
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={novaTransacao.categoria}
                    onChange={(e) =>
                      setNovaTransacao((prev) => ({
                        ...prev,
                        categoria: e.target.value,
                      }))
                    }
                  >
                    <option value="">Selecione uma categoria</option>
                    {getCategoriasPorTipo(novaTransacao.tipo).map((cat, index) => (
                      <option key={`${cat.nome}-${cat.tipo}-${index}`} value={cat.nome}>
                        {cat.icone} {cat.nome}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Data */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    {novaTransacao.tipo === "receita" ? "Data de Recebimento" : "Data de Vencimento"} *
                  </label>
                  <input
                    type="date"
                    required
                    className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                    value={novaTransacao.data}
                    onChange={(e) =>
                      setNovaTransacao((prev) => ({
                        ...prev,
                        data: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              {/* Método de pagamento */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Método de Pagamento
                </label>
                <select
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={novaTransacao.metodo_pagamento}
                  onChange={(e) =>
                    setNovaTransacao((prev) => ({
                      ...prev,
                      metodo_pagamento: e.target.value,
                    }))
                  }
                >
                  <option value="">Selecione um método</option>
                  <option value="Dinheiro">💵 Dinheiro</option>
                  <option value="Cartão de Débito">💳 Cartão de Débito</option>
                  <option value="Cartão de Crédito">💳 Cartão de Crédito</option>
                  <option value="PIX">📱 PIX</option>
                  <option value="Transferência">🏦 Transferência</option>
                  <option value="Boleto">📄 Boleto</option>
                </select>
              </div>

              {/* Observações */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Observações
                </label>
                <textarea
                  rows={3}
                  className="w-full px-4 py-3 border border-input rounded-lg bg-background focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
                  value={novaTransacao.observacoes}
                  onChange={(e) =>
                    setNovaTransacao((prev) => ({
                      ...prev,
                      observacoes: e.target.value,
                    }))
                  }
                  placeholder="Informações adicionais sobre a transação..."
                />
              </div>

              {/* Opções */}
              <div className="flex flex-wrap gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novaTransacao.recorrente}
                    onChange={(e) =>
                      setNovaTransacao((prev) => ({
                        ...prev,
                        recorrente: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm">Transação recorrente</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={novaTransacao.favorito}
                    onChange={(e) =>
                      setNovaTransacao((prev) => ({
                        ...prev,
                        favorito: e.target.checked,
                      }))
                    }
                    className="w-4 h-4 text-primary border-gray-300 rounded focus:ring-primary focus:ring-2"
                  />
                  <span className="text-sm">Marcar como favorito</span>
                </label>
              </div>

              {/* Botões */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 md:pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingId(null);
                    setNovaTransacao({
                      descricao: "",
                      valor: "",
                      tipo: "despesa",
                      categoria: "",
                      data: new Date().toISOString().split("T")[0],
                      observacoes: "",
                      metodo_pagamento: "",
                      recorrente: false,
                      favorito: false,
                    });
                  }}
                  className="px-4 md:px-6 py-2 md:py-3 border border-input rounded-lg text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 md:px-6 py-2 md:py-3 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? "Atualizar" : "Salvar"} Transação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}