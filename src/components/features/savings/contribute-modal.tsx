'use client'

import { useState } from 'react'
import { X, Trophy, Loader2 } from 'lucide-react'
import { Poupanca } from '@/hooks/use-savings'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ContributeModalProps {
  poupanca: Poupanca | null
  isOpen: boolean
  onClose: () => void
  onContribute: (amount: number) => Promise<void>
  showValues: boolean
  loading?: boolean
}

export function ContributeModal({
  poupanca,
  isOpen,
  onClose,
  onContribute,
  showValues,
  loading = false
}: ContributeModalProps) {
  const [amount, setAmount] = useState('')

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const contributionAmount = parseFloat(amount)
    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      return
    }

    try {
      await onContribute(contributionAmount)
      setAmount('')
      onClose()
    } catch (error) {
      // Error is handled by parent component
    }
  }

  const handleClose = () => {
    setAmount('')
    onClose()
  }

  if (!poupanca) return null

  const currentProgress = calculateProgress(poupanca.valor_atual, poupanca.valor_objetivo)
  const newAmount = poupanca.valor_atual + parseFloat(amount || '0')
  const newProgress = calculateProgress(newAmount, poupanca.valor_objetivo)
  const willComplete = newAmount >= poupanca.valor_objetivo
  const remaining = Math.max(0, poupanca.valor_objetivo - poupanca.valor_atual)

  // Sugestões de valores baseadas no valor restante
  const getSuggestions = (): number[] => {
    const suggestions: number[] = []
    const percentages = [10, 25, 50, 100]
    
    percentages.forEach(percent => {
      const value = Math.round((remaining * percent) / 100)
      if (value > 0 && value <= remaining && !suggestions.includes(value)) {
        suggestions.push(value)
      }
    })

    // Adicionar valores fixos se forem menores que o restante
    const fixedValues = [50, 100, 200, 500]
    fixedValues.forEach(value => {
      if (value <= remaining && !suggestions.includes(value)) {
        suggestions.push(value)
      }
    })

    return suggestions.sort((a, b) => a - b).slice(0, 4)
  }

  const suggestions = getSuggestions()

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span>Fazer Contribuição</span>
          </DialogTitle>
        </DialogHeader>

        {/* Info da meta */}
        <div className="bg-muted/50 p-4 rounded-lg mb-6">
          <h4 className="font-medium mb-3">{poupanca.descricao}</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Valor atual:</span>
              <span className="font-medium">{formatCurrency(poupanca.valor_atual)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Meta:</span>
              <span className="font-medium">{formatCurrency(poupanca.valor_objetivo)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Restante:</span>
              <span className="font-medium text-blue-600">
                {formatCurrency(remaining)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Progresso atual:</span>
              <span className="font-medium text-emerald-600">
                {currentProgress.toFixed(1)}%
              </span>
            </div>
          </div>

          {/* Barra de progresso atual */}
          <div className="mt-3">
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${Math.min(currentProgress, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="amount" className="text-sm font-medium mb-2 block">
              Valor da Contribuição (R$) *
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={remaining}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0,00"
              autoFocus
              className="text-lg"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Máximo: {formatCurrency(remaining)}
            </p>
          </div>

          {/* Sugestões rápidas */}
          {suggestions.length > 0 && (
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Sugestões rápidas:
              </Label>
              <div className="grid grid-cols-2 gap-2">
                {suggestions.map(value => (
                  <Button
                    key={value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setAmount(value.toString())}
                    className="text-xs"
                  >
                    {formatCurrency(value)}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Preview da contribuição */}
          {amount && !isNaN(parseFloat(amount)) && parseFloat(amount) > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-emerald-800 mb-3">
                Preview após contribuição
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-emerald-700">Novo valor total:</span>
                  <span className="font-medium text-emerald-800">
                    {formatCurrency(newAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-700">Novo progresso:</span>
                  <span className="font-medium text-emerald-800">
                    {newProgress.toFixed(1)}%
                  </span>
                </div>
                
                {/* Barra de progresso nova */}
                <div className="mt-3">
                  <div className="w-full bg-emerald-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full bg-emerald-500 transition-all duration-300"
                      style={{ width: `${Math.min(newProgress, 100)}%` }}
                    ></div>
                  </div>
                </div>
                
                {/* Verificar se vai completar a meta */}
                {willComplete && (
                  <div className="flex items-center gap-2 text-emerald-700 font-medium mt-3 p-3 bg-emerald-100 rounded border border-emerald-300">
                    <Trophy className="h-4 w-4" />
                    <span>🎉 Esta contribuição completará sua meta!</span>
                  </div>
                )}

                {/* Diferença no progresso */}
                {!willComplete && (
                  <div className="flex justify-between pt-2 border-t border-emerald-200">
                    <span className="text-emerald-700">Aumento no progresso:</span>
                    <span className="font-medium text-emerald-800">
                      +{(newProgress - currentProgress).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Contribuir
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}