'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
  BarChart3,
  Calendar,
  User,
  Building2
} from 'lucide-react'

// Interfaces (mesmas do componente original)
interface ReportData {
  totalReceitas: number
  totalDespesas: number
  totalPoupanca: number
  saldoFinal: number
  totalTransacoes: number
  totalMetas: number
  metasAtingidas: number
  periodo: string
  despesasPorCategoria: Array<{ categoria: string; valor: number; percentual: number }>
  receitasPorCategoria: Array<{ categoria: string; valor: number; percentual: number }>
  evolucaoMensal: Array<{ mes: string; receitas: number; despesas: number; saldo: number }>
  metasPoupanca: Array<{ descricao: string; atual: number; objetivo: number; progresso: number }>
  dataGeracao?: string
  usuario?: string
}

export default function RelatorioImpressao() {
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Carregar dados do localStorage
    const printDataString = localStorage.getItem('printReportData')
    if (printDataString) {
      try {
        const data = JSON.parse(printDataString)
        setReportData(data)
      } catch (error) {
        console.error('Erro ao carregar dados para impressão:', error)
      }
    }
    setLoading(false)

    // Configurar impressão automática após carregamento
    const timer = setTimeout(() => {
      window.print()
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <BarChart3 className="h-12 w-12 animate-pulse text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Preparando relatório para impressão...</p>
        </div>
      </div>
    )
  }

  if (!reportData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-medium">Erro: Dados do relatório não encontrados</p>
          <p className="text-gray-600 mt-2">Por favor, gere o relatório novamente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="print-container">
      {/* Estilos específicos para impressão */}
      <style jsx>{`
        @media print {
          body { margin: 0; }
          .print-container {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #1f2937;
            line-height: 1.4;
          }
          .page-break {
            page-break-before: always;
          }
          .no-print {
            display: none;
          }
          .print-only {
            display: block;
          }
        }
        
        @media screen {
          .print-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 20px;
            background: white;
            min-height: 100vh;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .print-only {
            display: none;
          }
        }
        
        .header {
          text-align: center;
          margin-bottom: 30px;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 20px;
        }
        
        .company-info {
          display: flex;
          justify-content: space-between;
          margin-bottom: 20px;
          font-size: 14px;
          color: #6b7280;
        }
        
        .summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
          margin-bottom: 30px;
        }
        
        .summary-card {
          border: 1px solid #d1d5db;
          border-radius: 8px;
          padding: 16px;
          background: #f9fafb;
        }
        
        .summary-card h3 {
          margin: 0 0 8px 0;
          font-size: 14px;
          color: #6b7280;
          font-weight: 500;
        }
        
        .summary-card .value {
          font-size: 24px;
          font-weight: 700;
          margin: 0;
        }
        
        .positive { color: #059669; }
        .negative { color: #dc2626; }
        .neutral { color: #3b82f6; }
        
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
        }
        
        .table th,
        .table td {
          border: 1px solid #d1d5db;
          padding: 12px;
          text-align: left;
        }
        
        .table th {
          background: #f3f4f6;
          font-weight: 600;
          color: #374151;
        }
        
        .table td {
          font-size: 14px;
        }
        
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
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
          margin: 4px 0;
        }
        
        .progress-fill {
          height: 100%;
          background: #3b82f6;
          transition: width 0.3s ease;
        }
        
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          font-size: 12px;
          color: #6b7280;
          text-align: center;
        }
        
        @media print {
          .summary-grid { grid-template-columns: repeat(4, 1fr); }
        }
      `}</style>

      {/* Cabeçalho */}
      <header className="header">
        <h1 style={{ margin: '0 0 8px 0', fontSize: '28px', fontWeight: '700', color: '#111827' }}>
          Relatório Financeiro
        </h1>
        <p style={{ margin: '0', fontSize: '16px', color: '#6b7280' }}>
          {reportData.periodo}
        </p>
      </header>

      {/* Informações do relatório */}
      <div className="company-info">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <User className="h-4 w-4" />
            <span>Usuário: {reportData.usuario || 'Sistema'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar className="h-4 w-4" />
            <span>Período: {reportData.periodo}</span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <BarChart3 className="h-4 w-4" />
            <span>Gerado em: {reportData.dataGeracao || new Date().toLocaleString('pt-BR')}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Building2 className="h-4 w-4" />
            <span>Sistema Financeiro</span>
          </div>
        </div>
      </div>

      {/* Resumo Financeiro */}
      <div className="summary-grid">
        <div className="summary-card">
          <h3>Total de Receitas</h3>
          <p className="value positive">{formatCurrency(reportData.totalReceitas)}</p>
        </div>
        
        <div className="summary-card">
          <h3>Total de Despesas</h3>
          <p className="value negative">{formatCurrency(reportData.totalDespesas)}</p>
        </div>
        
        <div className="summary-card">
          <h3>Saldo Final</h3>
          <p className={`value ${reportData.saldoFinal >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(reportData.saldoFinal)}
          </p>
        </div>
        
        <div className="summary-card">
          <h3>Poupança Total</h3>
          <p className="value neutral">{formatCurrency(reportData.totalPoupanca)}</p>
        </div>
      </div>

      {/* Estatísticas Gerais */}
      <div className="section">
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
                  <td className="negative">{formatCurrency(categoria.valor)}</td>
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
                  <td className="positive">{formatCurrency(categoria.valor)}</td>
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
                  <td style={{ fontWeight: '600' }}>{mes.mes}</td>
                  <td className="positive">{formatCurrency(mes.receitas)}</td>
                  <td className="negative">{formatCurrency(mes.despesas)}</td>
                  <td className={mes.saldo >= 0 ? 'positive' : 'negative'}>
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
          <div style={{ marginBottom: '20px' }}>
            {reportData.metasPoupanca.map((meta, index) => (
              <div key={index} style={{ 
                border: '1px solid #d1d5db', 
                borderRadius: '8px', 
                padding: '16px', 
                marginBottom: '16px',
                background: '#f9fafb'
              }}>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '8px'
                }}>
                  <span style={{ fontWeight: '600', fontSize: '16px' }}>{meta.descricao}</span>
                  <span style={{ 
                    fontSize: '14px', 
                    color: '#6b7280',
                    fontWeight: '500'
                  }}>
                    {meta.progresso.toFixed(1)}%
                  </span>
                </div>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${Math.min(meta.progresso, 100)}%` }}
                  ></div>
                </div>
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  fontSize: '14px',
                  color: '#6b7280',
                  marginTop: '8px'
                }}>
                  <span>Atual: {formatCurrency(meta.atual)}</span>
                  <span>Objetivo: {formatCurrency(meta.objetivo)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Análise Financeira */}
      <div className="section">
        <h2>Análise Financeira</h2>
        <div style={{ 
          border: '1px solid #d1d5db', 
          borderRadius: '8px', 
          padding: '20px',
          background: '#f9fafb'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                Taxa de Economia
              </div>
              <div style={{ 
                fontSize: '20px', 
                fontWeight: '700',
                color: reportData.saldoFinal >= 0 ? '#059669' : '#dc2626'
              }}>
                {reportData.totalReceitas > 0 ? 
                  `${((reportData.saldoFinal / reportData.totalReceitas) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </div>
            </div>
            <div>
              <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                Maior Categoria de Despesa
              </div>
              <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>
                {reportData.despesasPorCategoria[0]?.categoria || 'N/A'}
              </div>
            </div>
          </div>
          
          {reportData.saldoFinal < 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#fef2f2', 
              border: '1px solid #fecaca',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#991b1b'
            }}>
              <strong>Atenção:</strong> Suas despesas excederam suas receitas neste período. 
              Considere revisar seus gastos e ajustar seu orçamento.
            </div>
          )}
          
          {reportData.metasAtingidas === reportData.totalMetas && reportData.totalMetas > 0 && (
            <div style={{ 
              marginTop: '16px', 
              padding: '12px', 
              backgroundColor: '#f0fdf4', 
              border: '1px solid #bbf7d0',
              borderRadius: '6px',
              fontSize: '14px',
              color: '#166534'
            }}>
              <strong>Parabéns!</strong> Todas as suas metas de poupança foram atingidas!
            </div>
          )}
        </div>
      </div>

      {/* Rodapé */}
      <footer className="footer">
        <p>
          Este relatório foi gerado automaticamente pelo Sistema Financeiro em {formatDate(reportData.dataGeracao || new Date().toISOString())}
        </p>
        <p style={{ marginTop: '8px' }}>
          Documento confidencial - Para uso interno apenas
        </p>
      </footer>

      {/* Botões para tela (não aparecem na impressão) */}
      <div className="no-print" style={{ 
        position: 'fixed', 
        bottom: '20px', 
        right: '20px', 
        display: 'flex', 
        gap: '12px',
        zIndex: 1000
      }}>
        <button
          onClick={() => window.print()}
          style={{
            backgroundColor: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          🖨️ Imprimir Novamente
        </button>
        <button
          onClick={() => window.close()}
          style={{
            backgroundColor: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            padding: '12px 20px',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}
        >
          ✖️ Fechar
        </button>
      </div>
    </div>
  )
}