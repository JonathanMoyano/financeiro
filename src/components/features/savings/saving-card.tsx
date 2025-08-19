'use client'

import { useState } from 'react'
import {
  Edit2,
  Trash2,
  Plus,
  Calendar,
  Target,
  Trophy,
  AlertTriangle
} from 'lucide-react'
import { Poupanca } from '@/hooks/use-savings'

interface SavingCardProps {
  poupanca: Poupanca
  showValues: boolean
  onEdit: (poupanca: Poupanca) => void
  onDelete: (id: string) => void
  onContribute: (poupanca: Poupanca) => void
}

export function SavingCard({ 
  poupanca, 
  showValues, 
  onEdit, 
  onDelete, 
  onContribute 
}: SavingCardProps) {
  const [isHovered, setIsHovered] = useState(false)

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

  const getDaysRemaining = (dataObjetivo: string) => {
    const hoje = new Date()
    const objetivo = new Date(dataObjetivo)
    const diffTime = objetivo.getTime() - hoje.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getCategoriaInfo = (categoria: string) => {
    const categorias = {
      'Reserva de Emergência': { icone: '🛡️', cor: '#ef4444' },
      'Viagem': { icone: '✈️', cor: '#3b82f6' },
      'Casa Própria': { icone: '🏠', cor: '#10b981' },
      'Educação': { icone: '📚', cor: '#8b5cf6' },
      'Aposentadoria': { icone: '👴', cor: '#f59e0b' },
      'Investimento': { icone: '📈', cor: '#06b6d4' },
      'Veículo': { icone: '🚗', cor: '#84cc16' },
      'Outros': { icone: '💰', cor: '#6b7280' }
    }
    
    return categorias[categoria as keyof typeof categorias] || categorias['Outros']
  }

  const progress = calculateProgress(poupanca.valor_atual, poupanca.valor_objetivo)
  const isCompleted = progress >= 100
  const categoriaInfo = getCategoriaInfo(poupanca.categoria)
  const daysRemaining = getDaysRemaining(poupanca.data_objetivo)

  return (
    <div 
      className={`bg-card rounded-xl p-6 border transition-all duration-200 hover:shadow-md ${
        isCompleted ? 'ring-2 ring-emerald-200 bg-emerald-50/50' : ''
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div 
            className="p-3 rounded-xl text-2xl transition-transform duration-200"
            style={{ 
              backgroundColor: `${categoriaInfo.cor}20`,
              transform: isHovered ? 'scale(1.1)' : 'scale(1)'
            }}
          >
            {categoriaInfo.icone}
          </div>
          <div>
            <h3 className="text-xl font-semibold mb-1">{poupanca.descricao}</h3>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                {poupanca.categoria}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(poupanca.data_objetivo).toLocaleDateString('pt-BR')}
              </span>
              {daysRemaining > 0 ? (
                <span className="text-blue-600">
                  {daysRemaining} dias restantes
                </span>
              ) : daysRemaining === 0 ? (
                <span className="text-yellow-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Meta vence hoje!
                </span>
              ) : (
                <span className="text-red-600 font-medium flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  Venceu há {Math.abs(daysRemaining)} dias
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isCompleted && (
            <button
              onClick={() => onContribute(poupanca)}
              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Fazer contribuição"
            >
              <Plus className="h-4 w-4" />
            </button>
          )}
          <button
            onClick={() => onEdit(poupanca)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Editar meta"
          >
            <Edit2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => onDelete(poupanca.id)}
            className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
            title="Excluir meta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Progresso */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">
            Progresso: {progress.toFixed(1)}%
          </span>
          <span className="text-sm text-muted-foreground">
            {formatCurrency(poupanca.valor_atual)} / {formatCurrency(poupanca.valor_objetivo)}
          </span>
        </div>
        
        <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
          <div 
            className={`h-3 rounded-full transition-all duration-700 ease-out ${
              isCompleted 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' 
                : progress > 75
                ? 'bg-gradient-to-r from-blue-500 to-emerald-500'
                : progress > 50
                ? 'bg-gradient-to-r from-yellow-500 to-blue-500'
                : 'bg-gradient-to-r from-red-400 to-yellow-500'
            }`}
            style={{ 
              width: `${Math.min(progress, 100)}%`,
              transform: isHovered ? 'scaleY(1.2)' : 'scaleY(1)',
              transformOrigin: 'bottom'
            }}
          ></div>
        </div>
        
        {isCompleted && (
          <div className="flex items-center gap-2 text-emerald-600 font-medium bg-emerald-50 p-3 rounded-lg border border-emerald-200 animate-pulse">
            <Trophy className="h-4 w-4" />
            <span>🎉 Meta atingida! Parabéns!</span>
          </div>
        )}
        
        {poupanca.observacoes && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg border-l-4 border-primary/20">
            <strong>Observações:</strong> {poupanca.observacoes}
          </div>
        )}

        {/* Informações adicionais */}
        <div className="flex justify-between items-center text-xs text-muted-foreground pt-2">
          <span>
            Criada em {new Date(poupanca.created_at).toLocaleDateString('pt-BR')}
          </span>
          <span>
            Faltam {formatCurrency(Math.max(0, poupanca.valor_objetivo - poupanca.valor_atual))}
          </span>
        </div>

        {/* Barra de motivação */}
        {!isCompleted && progress > 0 && (
          <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-emerald-50 rounded-lg border border-blue-100">
            <div className="flex items-center justify-between text-sm">
              <span className="text-blue-700 font-medium">
                {progress < 25 ? '🌱 Começando bem!' : 
                 progress < 50 ? '🚀 No caminho certo!' :
                 progress < 75 ? '💪 Quase na metade!' :
                 progress < 90 ? '🔥 Chegando lá!' : '⭐ Quase perfeito!'}
              </span>
              <span className="text-emerald-600 font-medium">
                {((poupanca.valor_atual / poupanca.valor_objetivo) * 100).toFixed(0)}% concluído
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}