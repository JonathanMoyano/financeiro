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
  // CORREÇÃO: Usar as propriedades corretas do store
  const { isOpen, editingId, close } = useOpenTransaction();

  return (
    <Sheet open={isOpen} onOpenChange={close}>
      <SheetContent className="space-y-4">
        <SheetHeader>
          <SheetTitle>Editar Transação</SheetTitle>
          <SheetDescription>
            Faça as alterações necessárias na sua transação.
          </SheetDescription>
        </SheetHeader>
        {/* O formulário de edição precisa do ID da transação para saber qual item carregar,
          das categorias para o seletor, e da função close para fechar o painel.
        */}
        {editingId && (
          <EditTransactionForm
            transactionId={editingId}
            categories={categories}
            onClose={close}
          />
        )}
      </SheetContent>
    </Sheet>
  );
};