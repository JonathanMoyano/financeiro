"use client";

import { useState, useEffect } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  Calendar,
  User,
  Building2,
  Download,
  ArrowLeft,
} from "lucide-react";

// Interfaces (mesmas do componente original)
interface ReportData {
  totalReceitas: number;
  totalDespesas: number;
  totalPoupanca: number;
  saldoFinal: number;
  totalTransacoes: number;
  totalMetas: number;
  metasAtingidas: number;
  periodo: string;
  despesasPorCategoria: Array<{
    categoria: string;
    valor: number;
    percentual: number;
  }>;
  receitasPorCategoria: Array<{
    categoria: string;
    valor: number;
    percentual: number;
  }>;
  evolucaoMensal: Array<{
    mes: string;
    receitas: number;
    despesas: number;
    saldo: number;
  }>;
  metasPoupanca: Array<{
    descricao: string;
    atual: number;
    objetivo: number;
    progresso: number;
  }>;
  dataGeracao?: string;
  usuario?: string;
}

export default function RelatorioImpressao() {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Carregar dados do localStorage
    const printDataString = localStorage.getItem("printReportData");
    if (printDataString) {
      try {
        const data = JSON.parse(printDataString);

        // Garantir que a data de geração seja válida
        if (!data.dataGeracao || data.dataGeracao === "Invalid Date") {
          data.dataGeracao = new Date().toISOString();
        }

        setReportData(data);
      } catch (error) {
        console.error("Erro ao carregar dados para impressão:", error);
      }
    }
    setLoading(false);
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString?: string) => {
    try {
      const date = dateString ? new Date(dateString) : new Date();

      // Verificar se a data é válida
      if (isNaN(date.getTime())) {
        return new Date().toLocaleString("pt-BR", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
      }

      return date.toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (error) {
      console.error("Erro ao formatar data:", error);
      return new Date().toLocaleString("pt-BR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGoBack = () => {
    window.history.back();
  };

  const handleDownloadPDF = async () => {
    try {
      // Ocultar botões temporariamente
      const controls = document.querySelector(".print-controls") as HTMLElement;
      if (controls) controls.style.display = "none";

      // Aguardar um momento e imprimir
      setTimeout(() => {
        window.print();

        // Restaurar botões após um tempo
        setTimeout(() => {
          if (controls) controls.style.display = "flex";
        }, 1000);
      }, 100);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            Preparando relatório para impressão...
          </p>
        </div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">
            Erro: Dados do relatório não encontrados
          </p>
          <p className="text-gray-600 mt-2">
            Por favor, gere o relatório novamente.
          </p>
          <button
            onClick={handleGoBack}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Voltar
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Estilos CSS específicos para impressão */}
      <style jsx global>{`
        /* Reset básico */
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        /* Estilos para tela */
        @media screen {
          body {
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont,
              sans-serif;
            background-color: #f3f4f6;
            color: #1f2937;
            line-height: 1.5;
          }

          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            background: white;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
            min-height: 297mm;
            padding: 20mm;
          }
        }

        /* Estilos para impressão */
        @media print {
          /* Ocultar todos os elementos da página */
          body * {
            visibility: hidden;
          }

          /* Mostrar apenas o container de impressão */
          .print-container,
          .print-container * {
            visibility: visible;
          }

          /* Posicionar o container de impressão */
          .print-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 15mm;
            background: white !important;
            color: #000 !important;
            font-family: "Segoe UI", -apple-system, BlinkMacSystemFont,
              sans-serif;
            font-size: 12pt;
            line-height: 1.4;
            box-shadow: none;
          }

          /* Ocultar controles */
          .print-controls {
            display: none !important;
            visibility: hidden !important;
          }

          /* Ocultar elementos do layout principal */
          header,
          nav,
          aside,
          .sidebar,
          .navbar,
          .menu,
          [data-testid],
          [role="banner"],
          [role="navigation"],
          [role="complementary"],
          [role="contentinfo"] {
            display: none !important;
            visibility: hidden !important;
          }

          /* Classe especial para modo de impressão */
          body.printing * {
            visibility: hidden;
          }

          body.printing .print-container,
          body.printing .print-container * {
            visibility: visible;
          }

          body.printing .print-container {
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            z-index: 9999;
            background: white;
          }

          .page-break {
            page-break-before: always;
          }

          .avoid-break {
            page-break-inside: avoid;
          }

          /* Otimizações para impressão */
          .header {
            margin-bottom: 20pt;
          }

          .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 10pt;
            margin-bottom: 20pt;
          }

          .summary-card {
            border: 1pt solid #000;
            padding: 8pt;
            text-align: center;
          }

          .table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15pt;
            font-size: 10pt;
          }

          .table th,
          .table td {
            border: 1pt solid #000;
            padding: 6pt;
            text-align: left;
          }

          .table th {
            background-color: #f0f0f0;
            font-weight: bold;
          }

          .section {
            margin-bottom: 20pt;
          }

          .section h2 {
            font-size: 14pt;
            margin-bottom: 10pt;
            border-bottom: 1pt solid #000;
            padding-bottom: 4pt;
          }

          .stats-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 8pt;
            margin-bottom: 15pt;
          }

          .stat-box {
            border: 1pt solid #000;
            padding: 6pt;
            text-align: center;
          }

          /* Cores para impressão */
          .positive {
            color: #059669 !important;
          }
          .negative {
            color: #dc2626 !important;
          }
          .neutral {
            color: #3b82f6 !important;
          }
        }

        /* Estilos comuns */
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }

        .company-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 25px;
          font-size: 14px;
          color: #6b7280;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
          margin-bottom: 30px;
        }

        .summary-card {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          background: #f9fafb;
          text-align: center;
        }

        .summary-card h3 {
          margin-bottom: 8px;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }

        .summary-card .value {
          font-size: 20px;
          font-weight: 700;
        }

        .positive {
          color: #059669;
        }
        .negative {
          color: #dc2626;
        }
        .neutral {
          color: #3b82f6;
        }

        .section {
          margin-bottom: 30px;
        }

        .section h2 {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #111827;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 8px;
        }

        .table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 20px;
          font-size: 14px;
        }

        .table th,
        .table td {
          border: 1px solid #d1d5db;
          padding: 10px;
          text-align: left;
        }

        .table th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 16px;
          margin-bottom: 20px;
        }

        .stat-box {
          border: 1px solid #d1d5db;
          border-radius: 6px;
          padding: 12px;
          text-align: center;
          background: #f9fafb;
        }

        .stat-box .label {
          font-size: 12px;
          color: #6b7280;
          margin-bottom: 4px;
        }

        .stat-box .value {
          font-size: 16px;
          font-weight: 600;
          color: #111827;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin: 8px 0;
        }

        .progress-fill {
          height: 100%;
          background: #3b82f6;
        }

        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
      `}</style>

      {/* Controles de impressão (apenas na tela) */}
      <div className="print-controls fixed top-4 left-4 right-4 z-50 flex justify-between items-center bg-white/90 backdrop-blur-sm border rounded-lg p-3 shadow-lg">
        <button
          onClick={handleGoBack}
          className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="hidden sm:inline">Voltar</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Salvar PDF</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm"
          >
            <span>🖨️</span>
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Container principal do relatório */}
      <div className="print-container">
        {/* Cabeçalho */}
        <header className="header">
          <h1
            style={{
              fontSize: "28px",
              fontWeight: "700",
              color: "#111827",
              marginBottom: "8px",
            }}
          >
            Relatório Financeiro
          </h1>
          <p style={{ fontSize: "16px", color: "#6b7280" }}>
            {reportData.periodo}
          </p>
        </header>

        {/* Informações do relatório */}
        <div className="company-info">
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <User className="h-4 w-4" />
              <span>Usuário: {reportData.usuario || "Sistema"}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Calendar className="h-4 w-4" />
              <span>Período: {reportData.periodo}</span>
            </div>
          </div>
          <div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <BarChart3 className="h-4 w-4" />
              <span>Gerado em: {formatDate(reportData.dataGeracao)}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Building2 className="h-4 w-4" />
              <span>Sistema Financeiro</span>
            </div>
          </div>
        </div>

        {/* Resumo Financeiro */}
        <div className="summary-grid avoid-break">
          <div className="summary-card">
            <h3>Total de Receitas</h3>
            <p className="value positive">
              {formatCurrency(reportData.totalReceitas)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Total de Despesas</h3>
            <p className="value negative">
              {formatCurrency(reportData.totalDespesas)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Saldo Final</h3>
            <p
              className={`value ${
                reportData.saldoFinal >= 0 ? "positive" : "negative"
              }`}
            >
              {formatCurrency(reportData.saldoFinal)}
            </p>
          </div>

          <div className="summary-card">
            <h3>Poupança Total</h3>
            <p className="value neutral">
              {formatCurrency(reportData.totalPoupanca)}
            </p>
          </div>
        </div>

        {/* Estatísticas Gerais */}
        <div className="section avoid-break">
          <h2>Estatísticas Gerais</h2>
          <div className="stats-grid">
            <div className="stat-box">
              <div className="label">Total de Transações</div>
              <div className="value">{reportData.totalTransacoes}</div>
            </div>
            <div className="stat-box">
              <div className="label">Metas de Poupança</div>
              <div className="value">{reportData.totalMetas}</div>
            </div>
            <div className="stat-box">
              <div className="label">Metas Atingidas</div>
              <div className="value positive">{reportData.metasAtingidas}</div>
            </div>
          </div>
        </div>

        {/* Despesas por Categoria */}
        {reportData.despesasPorCategoria.length > 0 && (
          <div className="section">
            <h2>Despesas por Categoria</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {reportData.despesasPorCategoria.map((categoria, index) => (
                  <tr key={index}>
                    <td>{categoria.categoria}</td>
                    <td className="negative">
                      {formatCurrency(categoria.valor)}
                    </td>
                    <td>{categoria.percentual.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Receitas por Categoria */}
        {reportData.receitasPorCategoria.length > 0 && (
          <div className="section page-break">
            <h2>Receitas por Categoria</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Categoria</th>
                  <th>Valor</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                {reportData.receitasPorCategoria.map((categoria, index) => (
                  <tr key={index}>
                    <td>{categoria.categoria}</td>
                    <td className="positive">
                      {formatCurrency(categoria.valor)}
                    </td>
                    <td>{categoria.percentual.toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Evolução Mensal */}
        {reportData.evolucaoMensal.length > 0 && (
          <div className="section">
            <h2>Evolução Mensal</h2>
            <table className="table">
              <thead>
                <tr>
                  <th>Mês</th>
                  <th>Receitas</th>
                  <th>Despesas</th>
                  <th>Saldo</th>
                </tr>
              </thead>
              <tbody>
                {reportData.evolucaoMensal.map((mes, index) => (
                  <tr key={index}>
                    <td style={{ fontWeight: "600" }}>{mes.mes}</td>
                    <td className="positive">{formatCurrency(mes.receitas)}</td>
                    <td className="negative">{formatCurrency(mes.despesas)}</td>
                    <td className={mes.saldo >= 0 ? "positive" : "negative"}>
                      {formatCurrency(mes.saldo)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Metas de Poupança */}
        {reportData.metasPoupanca.length > 0 && (
          <div className="section">
            <h2>Progresso das Metas de Poupança</h2>
            <div style={{ marginBottom: "20px" }}>
              {reportData.metasPoupanca.map((meta, index) => (
                <div
                  key={index}
                  className="avoid-break"
                  style={{
                    border: "1px solid #d1d5db",
                    borderRadius: "8px",
                    padding: "16px",
                    marginBottom: "16px",
                    background: "#f9fafb",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "8px",
                    }}
                  >
                    <span style={{ fontWeight: "600", fontSize: "16px" }}>
                      {meta.descricao}
                    </span>
                    <span
                      style={{
                        fontSize: "14px",
                        color: "#6b7280",
                        fontWeight: "500",
                      }}
                    >
                      {meta.progresso.toFixed(1)}%
                    </span>
                  </div>
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${Math.min(meta.progresso, 100)}%` }}
                    ></div>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "14px",
                      color: "#6b7280",
                      marginTop: "8px",
                    }}
                  >
                    <span>Atual: {formatCurrency(meta.atual)}</span>
                    <span>Objetivo: {formatCurrency(meta.objetivo)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Análise Financeira */}
        <div className="section avoid-break">
          <h2>Análise Financeira</h2>
          <div
            style={{
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              padding: "20px",
              background: "#f9fafb",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Taxa de Economia
                </div>
                <div
                  style={{
                    fontSize: "20px",
                    fontWeight: "700",
                    color: reportData.saldoFinal >= 0 ? "#059669" : "#dc2626",
                  }}
                >
                  {reportData.totalReceitas > 0
                    ? `${(
                        (reportData.saldoFinal / reportData.totalReceitas) *
                        100
                      ).toFixed(1)}%`
                    : "0%"}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: "14px",
                    color: "#6b7280",
                    marginBottom: "4px",
                  }}
                >
                  Maior Categoria de Despesa
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "600",
                    color: "#111827",
                  }}
                >
                  {reportData.despesasPorCategoria[0]?.categoria || "N/A"}
                </div>
              </div>
            </div>

            {reportData.saldoFinal < 0 && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "12px",
                  backgroundColor: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: "6px",
                  fontSize: "14px",
                  color: "#991b1b",
                }}
              >
                <strong>Atenção:</strong> Suas despesas excederam suas receitas
                neste período. Considere revisar seus gastos e ajustar seu
                orçamento.
              </div>
            )}

            {reportData.metasAtingidas === reportData.totalMetas &&
              reportData.totalMetas > 0 && (
                <div
                  style={{
                    marginTop: "16px",
                    padding: "12px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "6px",
                    fontSize: "14px",
                    color: "#166534",
                  }}
                >
                  <strong>Parabéns!</strong> Todas as suas metas de poupança
                  foram atingidas!
                </div>
              )}
          </div>
        </div>

        {/* Rodapé */}
        <footer className="footer">
          <p>
            Este relatório foi gerado automaticamente pelo Sistema Financeiro em{" "}
            {formatDate(reportData.dataGeracao)}
          </p>
          <p style={{ marginTop: "8px" }}>
            Documento confidencial - Para uso interno apenas
          </p>
        </footer>
      </div>
    </>
  );
}
