'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowUpDown, 
  MoreHorizontal,
  Edit2,
  Trash2,
  Star,
  RefreshCw,
  TrendingUp,
  TrendingDown
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface Transacao {
  id: string
  user_id: string
  descricao: string
  valor: number
  tipo: 'receita' | 'despesa'
  categoria: string
  data: string
  observacoes?: string
  metodo_pagamento?: string
  recorrente: boolean
  favorito: boolean
  created_at: string
  updated_at: string
}

interface ActionsProps {
  transacao: Transacao
  onEdit: (transacao: Transacao) => void
  onDelete: (id: string, tipo: 'receita' | 'despesa') => void
  showValues: boolean
}

const ActionsCell = ({ transacao, onEdit, onDelete, showValues }: ActionsProps) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Abrir menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Ações</DropdownMenuLabel>
        <DropdownMenuItem
          onClick={() => navigator.clipboard.writeText(transacao.id)}
        >
          Copiar ID
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => onEdit(transacao)}
          className="flex items-center gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            if (confirm('Tem certeza que deseja excluir esta transação?')) {
              onDelete(transacao.id, transacao.tipo)
            }
          }}
          className="flex items-center gap-2 text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Excluir
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export const createColumns = (
  onEdit: (transacao: Transacao) => void,
  onDelete: (id: string, tipo: 'receita' | 'despesa') => void,
  showValues: boolean = true
): ColumnDef<Transacao>[] => [
  {
    accessorKey: 'tipo',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo') as string
      return (
        <div className="flex items-center gap-2">
          {tipo === 'receita' ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <Badge 
            variant={tipo === 'receita' ? 'default' : 'destructive'}
            className={tipo === 'receita' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}
          >
            {tipo === 'receita' ? 'Receita' : 'Despesa'}
          </Badge>
        </div>
      )
    },
  },
  {
    accessorKey: 'descricao',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Descrição
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const transacao = row.original
      return (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-medium">{transacao.descricao}</span>
            {transacao.favorito && (
              <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
            )}
            {transacao.recorrente && (
              <RefreshCw className="h-3 w-3 text-blue-500" />
            )}
          </div>
          {transacao.observacoes && (
            <span className="text-xs text-muted-foreground mt-1">
              {transacao.observacoes}
            </span>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'categoria',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Categoria
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      return (
        <Badge variant="outline">
          {row.getValue('categoria')}
        </Badge>
      )
    },
  },
  {
    accessorKey: 'valor',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Valor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const valor = parseFloat(row.getValue('valor'))
      const tipo = row.getValue('tipo') as string
      
      if (!showValues) {
        return <span className="text-muted-foreground">R$ ••••••</span>
      }

      const formatted = new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      }).format(valor)

      return (
        <div className={`font-medium ${
          tipo === 'receita' ? 'text-emerald-600' : 'text-red-600'
        }`}>
          {tipo === 'receita' ? '+' : '-'}{formatted}
        </div>
      )
    },
  },
  {
    accessorKey: 'data',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="h-auto p-0 font-medium"
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
    cell: ({ row }) => {
      const data = new Date(row.getValue('data'))
      return (
        <div className="flex flex-col">
          <span>{data.toLocaleDateString('pt-BR')}</span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.original.created_at).toLocaleTimeString('pt-BR')}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: 'metodo_pagamento',
    header: 'Método',
    cell: ({ row }) => {
      const metodo = row.getValue('metodo_pagamento') as string
      if (!metodo) return <span className="text-muted-foreground">-</span>
      
      const getIcon = (metodo: string) => {
        switch (metodo) {
          case 'Dinheiro': return '💵'
          case 'Cartão de Débito': return '💳'
          case 'Cartão de Crédito': return '💳'
          case 'PIX': return '📱'
          case 'Transferência': return '🏦'
          case 'Boleto': return '📄'
          default: return '💰'
        }
      }

      return (
        <div className="flex items-center gap-1">
          <span>{getIcon(metodo)}</span>
          <span className="text-sm">{metodo}</span>
        </div>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const transacao = row.original

      return (
        <ActionsCell
          transacao={transacao}
          onEdit={onEdit}
          onDelete={onDelete}
          showValues={showValues}
        />
      )
    },
  },
]