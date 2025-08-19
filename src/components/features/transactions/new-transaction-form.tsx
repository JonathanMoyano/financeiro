'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp,
  TrendingDown,
  X,
  Loader2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useOpenTransaction } from '@/store/use-open-transaction'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

interface Categoria {
  id: string
  nome: string
  tipo: 'receita' | 'despesa'
  icone: string
  cor: string
  ativa: boolean
}

interface TransactionFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function TransactionForm({ onSuccess, onError }: TransactionFormProps) {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingCategorias, setLoadingCategorias] = useState(false)

  const { user } = useAuth()
  const supabase = createClient()
  const transactionStore = useOpenTransaction()

  useEffect(() => {
    if (transactionStore.isOpen && user) {
      loadCategorias()
    }
  }, [transactionStore.isOpen, user])

  const loadCategorias = async () => {
    if (!user) return

    setLoadingCategorias(true)
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', user.id)
        .eq('ativa', true)
        .order('name')

      if (error) throw error

      const categoriasFormatadas = data?.map(cat => ({
        id: cat.id,
        nome: cat.name,
        tipo: cat.type as 'receita' | 'despesa',
        icone: cat.icon || '📁',
        cor: cat.cor || '#6b7280',
        ativa: cat.ativa
      })) || []

      setCategorias(categoriasFormatadas)
    } catch (error) {
      console.error('Erro ao carregar categorias:', error)
      onError?.('Erro ao carregar categorias')
    } finally {
      setLoadingCategorias(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    try {
      setLoading(true)

      const valor = parseFloat(transactionStore.data.valor)
      if (isNaN(valor) || valor <= 0) {
        onError?.('Por favor, insira um valor válido.')
        return
      }

      const transacaoData = {
        user_id: user.id,
        descricao: transactionStore.data.descricao,
        valor: valor,
        tipo: transactionStore.data.tipo,
        categoria: transactionStore.data.categoria,
        data: transactionStore.data.data,
        observacoes: transactionStore.data.observacoes || null,
        metodo_pagamento: transactionStore.data.metodo_pagamento || null,
        recorrente: transactionStore.data.recorrente,
        favorito: transactionStore.data.favorito
      }

      // Escolher a tabela baseada no tipo
      const tabela = transactionStore.data.tipo === 'receita' ? 'receitas' : 'despesas'

      let result
      if (transactionStore.editingId) {
        // Atualizar transação existente
        result = await supabase
          .from(tabela)
          .update(transacaoData)
          .eq('id', transactionStore.editingId)
          .eq('user_id', user.id)
      } else {
        // Criar nova transação
        result = await supabase
          .from(tabela)
          .insert(transacaoData)
      }

      if (result.error) throw result.error

      transactionStore.close()
      onSuccess?.()

    } catch (error: any) {
      console.error('Erro ao salvar transação:', error)
      onError?.('Erro ao salvar transação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const categoriasFiltradas = categorias.filter(cat => cat.tipo === transactionStore.data.tipo)

  return (
    <Dialog open={transactionStore.isOpen} onOpenChange={transactionStore.close}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transactionStore.getTitle()}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo */}
            <div>
              <Label className="text-sm font-medium mb-3 block">
                Tipo *
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => transactionStore.updateData({ tipo: 'receita' })}
                  className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    transactionStore.data.tipo === 'receita'
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <TrendingUp className="h-4 w-4" />
                  Receita
                </button>
                <button
                  type="button"
                  onClick={() => transactionStore.updateData({ tipo: 'despesa' })}
                  className={`p-3 rounded-lg border transition-colors flex items-center justify-center gap-2 ${
                    transactionStore.data.tipo === 'despesa'
                      ? 'bg-red-50 border-red-200 text-red-700'
                      : 'border-input hover:bg-accent'
                  }`}
                >
                  <TrendingDown className="h-4 w-4" />
                  Despesa
                </button>
              </div>
            </div>

            {/* Valor */}
            <div>
              <Label htmlFor="valor" className="text-sm font-medium mb-2 block">
                Valor (R$) *
              </Label>
              <Input
                id="valor"
                type="number"
                step="0.01"
                min="0"
                required
                value={transactionStore.data.valor}
                onChange={(e) => transactionStore.updateData({ valor: e.target.value })}
                placeholder="0,00"
              />
            </div>
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="descricao" className="text-sm font-medium mb-2 block">
              Descrição *
            </Label>
            <Input
              id="descricao"
              type="text"
              required
              value={transactionStore.data.descricao}
              onChange={(e) => transactionStore.updateData({ descricao: e.target.value })}
              placeholder="Ex: Compra no supermercado"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoria */}
            <div>
              <Label htmlFor="categoria" className="text-sm font-medium mb-2 block">
                Categoria *
              </Label>
              <Select
                value={transactionStore.data.categoria}
                onValueChange={(value) => transactionStore.updateData({ categoria: value })}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {loadingCategorias ? (
                    <SelectItem value="" disabled>
                      Carregando categorias...
                    </SelectItem>
                  ) : categoriasFiltradas.length > 0 ? (
                    categoriasFiltradas.map(cat => (
                      <SelectItem key={cat.id} value={cat.nome}>
                        {cat.icone} {cat.nome}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      Nenhuma categoria encontrada
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Data */}
            <div>
              <Label htmlFor="data" className="text-sm font-medium mb-2 block">
                Data *
              </Label>
              <Input
                id="data"
                type="date"
                required
                value={transactionStore.data.data}
                onChange={(e) => transactionStore.updateData({ data: e.target.value })}
              />
            </div>
          </div>

          {/* Método de pagamento */}
          <div>
            <Label htmlFor="metodo" className="text-sm font-medium mb-2 block">
              Método de Pagamento
            </Label>
            <Select
              value={transactionStore.data.metodo_pagamento}
              onValueChange={(value) => transactionStore.updateData({ metodo_pagamento: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Nenhum</SelectItem>
                <SelectItem value="Dinheiro">💵 Dinheiro</SelectItem>
                <SelectItem value="Cartão de Débito">💳 Cartão de Débito</SelectItem>
                <SelectItem value="Cartão de Crédito">💳 Cartão de Crédito</SelectItem>
                <SelectItem value="PIX">📱 PIX</SelectItem>
                <SelectItem value="Transferência">🏦 Transferência</SelectItem>
                <SelectItem value="Boleto">📄 Boleto</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div>
            <Label htmlFor="observacoes" className="text-sm font-medium mb-2 block">
              Observações
            </Label>
            <Textarea
              id="observacoes"
              rows={3}
              value={transactionStore.data.observacoes}
              onChange={(e) => transactionStore.updateData({ observacoes: e.target.value })}
              placeholder="Informações adicionais sobre a transação..."
            />
          </div>

          {/* Opções */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="recorrente"
                checked={transactionStore.data.recorrente}
                onCheckedChange={(checked) => 
                  transactionStore.updateData({ recorrente: !!checked })
                }
              />
              <Label htmlFor="recorrente" className="text-sm cursor-pointer">
                Transação recorrente
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="favorito"
                checked={transactionStore.data.favorito}
                onCheckedChange={(checked) => 
                  transactionStore.updateData({ favorito: !!checked })
                }
              />
              <Label htmlFor="favorito" className="text-sm cursor-pointer">
                Marcar como favorito
              </Label>
            </div>
          </div>

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={transactionStore.close}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {transactionStore.getSubmitText()} Transação
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}