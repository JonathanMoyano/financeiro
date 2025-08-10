// src/app/(platform)/relatorios/print/page.tsx
"use client";

import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  Wallet, 
  Activity,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
} from 'lucide-react';

// Tipos de dados que esperamos receber
type ReportData = {
  totalReceitas: number;
  totalDespesas: number;
  saldoFinal: number;
  transactionCount: number;
  balanceEvolution: { name: string; receitas: number; despesas: number; saldo: number }[];
  expensesByCategory: { name: string; value: number; percentage: number }[];
  incomeByCategory: { name: string; value: number; percentage: number }[];
};

type PrintPayload = {
  reportData: ReportData;
  periodLabel: string;
};

// Constantes e Funções Utilitárias
const COLORS = ['#ef4444', '#3b82f6', '#f97316', '#8b5cf6', '#22c55e', '#ec4899', '#14b8a6', '#f59e0b'];
const formatCurrency = (amount: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);

// Componente de Tooltip para os gráficos
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-3 text-sm">
          <p className="font-bold mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center">
              <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: entry.color }} />
              <span>{entry.name}: <span className="font-semibold">{formatCurrency(entry.value)}</span></span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

// Página de Impressão
export default function PrintReportPage() {
  const [data, setData] = useState<PrintPayload | null>(null);

  useEffect(() => {
    // 1. Pega os dados que a página anterior salvou no `sessionStorage`
    const storedData = sessionStorage.getItem('printData');
    
    if (storedData) {
      const parsedData = JSON.parse(storedData);
      setData(parsedData);
      
      // 2. Limpa o sessionStorage para não deixar lixo
      sessionStorage.removeItem('printData');

      // 3. Espera um instante para o conteúdo renderizar e então aciona a impressão
      setTimeout(() => {
        window.print();
      }, 500); // 500ms de espera para garantir que os gráficos renderizem
    } else {
        // Caso a página seja aberta diretamente, informa o usuário
        document.body.innerHTML = "Nenhum dado para imprimir. Gere um relatório na página anterior e clique em 'Imprimir'.";
    }
  }, []);

  if (!data) {
    return <div className="p-8 text-center">Carregando dados para impressão...</div>;
  }

  const { reportData, periodLabel } = data;

  return (
    <div className="bg-white text-black p-8 font-sans">
      {/* Cabeçalho do Relatório */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold mb-2">Relatório Financeiro</h1>
        <p className="text-lg text-gray-600">Período Analisado: {periodLabel}</p>
        <p className="text-sm text-gray-500">Gerado em: {new Date().toLocaleString('pt-BR')}</p>
      </div>

      {/* Cards de Resumo */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Resumo Geral</h2>
        <div className="grid grid-cols-4 gap-6">
          <div className="border p-4 rounded-lg"><h3 className="text-sm text-gray-500">Total de Receitas</h3><p className="text-2xl font-bold text-green-600">{formatCurrency(reportData.totalReceitas)}</p></div>
          <div className="border p-4 rounded-lg"><h3 className="text-sm text-gray-500">Total de Despesas</h3><p className="text-2xl font-bold text-red-600">{formatCurrency(reportData.totalDespesas)}</p></div>
          <div className="border p-4 rounded-lg"><h3 className="text-sm text-gray-500">Saldo Final</h3><p className={`text-2xl font-bold ${reportData.saldoFinal >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(reportData.saldoFinal)}</p></div>
          <div className="border p-4 rounded-lg"><h3 className="text-sm text-gray-500">Transações</h3><p className="text-2xl font-bold">{reportData.transactionCount}</p></div>
        </div>
      </section>
      
      {/* Seção de Gráficos */}
      <section className="space-y-10" style={{ breakBefore: 'page' }}>
        <h2 className="text-2xl font-semibold mb-4 border-b pb-2">Análise Visual</h2>
        
        {/* Evolução Mensal */}
        <div>
          <h3 className="text-xl font-semibold mb-4 text-center">Evolução Mensal (Receitas vs. Despesas)</h3>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={reportData.balanceEvolution} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} tickFormatter={(value) => `R$${(Number(value)/1000)}k`}/>
                <Tooltip content={<CustomTooltip />} />
                <Legend />
                <Bar dataKey="receitas" name="Receitas" fill="#22c55e" />
                <Bar dataKey="despesas" name="Despesas" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráficos de Categoria Lado a Lado */}
        <div className="grid grid-cols-2 gap-8 pt-8" style={{ breakBefore: 'page' }}>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">Despesas por Categoria</h3>
            <div className="w-full h-80">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie data={reportData.expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}>
                            {reportData.expensesByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-4 text-center">Receitas por Categoria</h3>
            <div className="w-full h-80">
            {reportData.incomeByCategory.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart><Pie data={reportData.incomeByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} labelLine={false} label={({ name, percentage }) => `${name} (${percentage.toFixed(0)}%)`}>
                        {reportData.incomeByCategory.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie><Tooltip content={<CustomTooltip />} /></PieChart>
                </ResponsiveContainer>
            ) : <p className="text-center text-gray-500 mt-16">Nenhuma receita registrada no período.</p>}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}