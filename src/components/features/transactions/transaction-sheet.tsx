"use client";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useOpenTransaction } from "@/store/use-open-transaction";
import { EditTransactionForm } from "@/components/features/transactions/edit-transaction-form";

// Este componente assume que você tem um formulário de edição em:
// src/components/features/transactions/edit-transaction-form.tsx

export const TransactionSheet = ({ categories }: { categories: { id: string, name: string }[] }) => {
  const { isOpen, onClose, id } = useOpenTransaction();

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>Editar Transação</SheetTitle>
          <SheetDescription>
            Faça as alterações necessárias na sua transação.
          </SheetDescription>
        </SheetHeader>
        {/* O formulário de edição precisa do ID da transação para saber qual item carregar,
          das categorias para o seletor, e da função onClose para fechar o painel.
        */}
        <EditTransactionForm
          transactionId={id}
          categories={categories}
          onClose={onClose}
        />
      </SheetContent>
    </Sheet>
  );
};
