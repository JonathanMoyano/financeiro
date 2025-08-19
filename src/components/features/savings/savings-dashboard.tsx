'use client'

import { Target, DollarSign, PiggyBank, Trophy, TrendingUp, AlertTriangle } from 'lucide-react'
import { Poupanca } from '@/hooks/use-savings'

interface SavingsDashboardProps {
  poupancas: Poupanca[]
  showValues: boolean
}

export function SavingsDashboard({ poupancas, showValues }: SavingsDashboardProps) {
  const formatCurrency = (value: number) => {
    if (!showValues) return 'R$ ••••••'
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value)
  }

  const calculateProgress = (atual: number, objetivo: number) => {
    if (objetivo <= 0) return 0
    return Math.min((atual / objetivo) * 100, 100)
  }

  // Calcular estatísticas
  const totalPoupancas = poupancas.length
  const totalObjetivo = poupancas.reduce((sum, p) => sum + p.valor_objetivo, 0)
  const totalAtual = poupancas.reduce((sum, p) => sum + p.valor_atual, 0)
  const metasCompletas = poupancas.filter(p => calculateProgress(p.valor_atual, p.valor_objetivo) >= 100).length
  const progressoGeral = totalObjetivo > 0 ? (totalAtual / totalObjetivo) * 100 : 0

  // Metas próximas do vencimento (próximos 30 dias)
  const getExpiringGoals = () => {
    const now = new Date()
    const futureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    return poupancas.filter(p => {
      const goalDate = new Date(p.data_objetivo)
      return goalDate <= futureDate && goalDate >= now && p.valor_atual < p.valor_objetivo
    })
  }

  const expiringGoals = getExpiringGoals()

  // Meta com maior progresso
  const topPerformingGoal = poupancas
    .filter(p => p.valor_atual < p.valor_objetivo)
    .sort((a, b) => calculateProgress(b.valor_atual, b.valor_objetivo) - calculateProgress(a.valor_atual, a.valor_objetivo))[0]

  return (
    <div className="space-y-6">
      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Target className="h-6 w-6 text-blue-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total de Metas</p>
              <p className="text-2xl font-bold text-blue-500">{totalPoupancas}</p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {totalPoupancas === 0 ? 'Nenhuma meta criada' : 
             totalPoupancas === 1 ? '1 meta ativa' : `${totalPoupancas} metas ativas`}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <DollarSign className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Total Poupado</p>
              <p className="text-2xl font-bold text-emerald-500">
                {formatCurrency(totalAtual)}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {progressoGeral.toFixed(1)}% do objetivo total
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <PiggyBank className="h-6 w-6 text-purple-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Meta Total</p>
              <p className="text-2xl font-bold text-purple-500">
                {formatCurrency(totalObjetivo)}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Faltam {formatCurrency(Math.max(0, totalObjetivo - totalAtual))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 rounded-xl bg-yellow-500/10">
              <Trophy className="h-6 w-6 text-yellow-500" />
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground mb-1">Metas Completas</p>
              <p className="text-2xl font-bold text-yellow-500">
                {metasCompletas}/{totalPoupancas}
              </p>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            {totalPoupancas > 0 ? `${((metasCompletas / totalPoupancas) * 100).toFixed(1)}% concluídas` : 'Nenhuma meta'}
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      {totalPoupancas > 0 && (
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Progresso Geral das Metas</h3>
            <span className="text-sm text-muted-foreground">
              {progressoGeral.toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-muted rounded-full h-4 mb-4">
            <div 
              className="h-4 rounded-full transition-all duration-500 bg-gradient-to-r from-blue-500 to-emerald-500"
              style={{ width: `${Math.min(progressoGeral, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Atual: {formatCurrency(totalAtual)}</span>
            <span>Objetivo: {formatCurrency(totalObjetivo)}</span>
          </div>
        </div>
      )}

      {/* Informações adicionais */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Meta com melhor performance */}
        {topPerformingGoal && (
          <div className="bg-card rounded-xl p-6 border">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <h3 className="text-lg font-semibold">Meta com Melhor Progresso</h3>
            </div>
            <div className="space-y-3">
              <div>
                <h4 className="font-medium">{topPerformingGoal.descricao}</h4>
                <p className="text-sm text-muted-foreground">{topPerformingGoal.categoria}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Progresso:</span>
                <span className="font-medium text-emerald-600">
                  {calculateProgress(topPerformingGoal.valor_atual, topPerformingGoal.valor_objetivo).toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                  style={{ 
                    width: `${Math.min(
                      calculateProgress(topPerformingGoal.valor_atual, topPerformingGoal.valor_objetivo), 
                      100
                    )}%` 
                  }}
                ></div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatCurrency(topPerformingGoal.valor_atual)}</span>
                <span>{formatCurrency(topPerformingGoal.valor_objetivo)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Metas próximas do vencimento */}
        <div className="bg-card rounded-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-yellow-500/10">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
            </div>
            <h3 className="text-lg font-semibold">Atenção Necessária</h3>
          </div>
          
          {expiringGoals.length > 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                {expiringGoals.length} meta{expiringGoals.length !== 1 ? 's' : ''} vence{expiringGoals.length === 1 ? '' : 'm'} nos próximos 30 dias:
              </p>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {expiringGoals.slice(0, 3).map(goal => {
                  const daysRemaining = Math.ceil((new Date(goal.data_objetivo).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                  const progress = calculateProgress(goal.valor_atual, goal.valor_objetivo)
                  
                  return (
                    <div key={goal.id} className="flex justify-between items-center p-2 bg-yellow-50 rounded border border-yellow-200">
                      <div>
                        <p className="text-sm font-medium">{goal.descricao}</p>
                        <p className="text-xs text-muted-foreground">
                          {daysRemaining > 0 ? `${daysRemaining} dias restantes` : 'Vence hoje'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{progress.toFixed(1)}%</p>
                        <p className="text-xs text-muted-foreground">progresso</p>
                      </div>
                    </div>
                  )
                })}
              </div>
              {expiringGoals.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{expiringGoals.length - 3} mais meta{expiringGoals.length - 3 !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Nenhuma meta precisa de atenção imediata
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Todas as metas estão dentro do prazo
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Distribuição por categoria */}
      {totalPoupancas > 0 && (
        <div className="bg-card rounded-xl p-6 border">
          <h3 className="text-lg font-semibold mb-4">Distribuição por Categoria</h3>
          <div className="space-y-3">
            {Object.entries(
              poupancas.reduce((acc, p) => {
                acc[p.categoria] = (acc[p.categoria] || 0) + p.valor_atual
                return acc
              }, {} as Record<string, number>)
            )
            .sort(([,a], [,b]) => b - a)
            .map(([categoria, valor]) => {
              const percentage = totalAtual > 0 ? (valor / totalAtual) * 100 : 0
              
              return (
                <div key={categoria} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-primary rounded-full"></div>
                    <span className="text-sm font-medium">{categoria}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">{formatCurrency(valor)}</div>
                    <div className="text-xs text-muted-foreground">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}