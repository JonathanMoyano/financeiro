"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

import { deleteTransaction } from "@/app/actions/transactions";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useConfirm } from "@/hooks/use-confirm";
import { useOpenTransaction } from "@/store/use-open-transaction";

// Este é o tipo de dado que esperamos para cada linha
// Corresponde à estrutura que você definiu
export type Transaction = {
  id: string;
  date: string;
  description: string | null;
  amount: number;
  type: "income" | "expense";
};

// Função para formatar moeda para Real Brasileiro
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);
};

// Componente para o menu de ações de cada linha, agora com a lógica funcional
const Actions = ({ transaction }: { transaction: Transaction }) => {
  const { onOpen } = useOpenTransaction();
  const [ConfirmDialog, confirm] = useConfirm(
    "Tem a certeza?",
    "Não poderá reverter esta ação."
  );

  const handleDelete = async () => {
    const ok = await confirm();
    if (ok) {
      const promise = deleteTransaction({ id: transaction.id });

      toast.promise(promise, {
        loading: "A eliminar transação...",
        success: "Transação eliminada com sucesso!",
        error: "Erro ao eliminar a transação.",
      });
    }
  };

  return (
    <>
      <ConfirmDialog />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => onOpen(transaction.id)}>
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="text-red-600">
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};

export const columns: ColumnDef<Transaction>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value: boolean) =>
          table.toggleAllPageRowsSelected(!!value)
        }
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value: boolean) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "date",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Data
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("date"));
      // Adiciona verificação para data inválida
      if (isNaN(date.getTime())) {
        return <span>Data inválida</span>;
      }
      return <span>{date.toLocaleDateString("pt-BR")}</span>;
    },
  },
  {
    accessorKey: "description",
    header: "Descrição",
  },
  {
    accessorKey: "amount",
    header: ({ column }) => {
      return (
        <div className="text-right">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Valor
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        </div>
      );
    },
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue("amount"));
      const type = row.original.type;

      const formatted = formatCurrency(amount);

      return (
        <div
          className={`text-right font-medium ${
            type === "expense" ? "text-red-500" : "text-green-500"
          }`}
        >
          {formatted}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => <Actions transaction={row.original} />,
  },
];
