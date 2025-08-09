// src/app/(platform)/despesas/page.tsx
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useFormState, useFormStatus } from 'react-dom';
import { PlusCircle, Loader2, ArrowUpCircle, ArrowDownCircle, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from 'sonner';
import { createTransaction, deleteTransaction } from '@/app/actions/transactions';
import { cn } from '@/lib/utils';

// Tipos de dados
type Transaction = {
  id: string;
  created_at?: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  user_id?: string;
  categories?: { name: string }; 
};

type Category = {
  id: string;
  name: string;
};

type ActionResult = {
  success: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

// Componente do botão de submissão para mostrar estado de loading
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Salvar
    </Button>
  );
}

// Componente para as ações da transação - CORRIGIDO
function TransactionActions({ 
  transaction, 
  onEdit, 
  onDelete 
}: { 
  transaction: Transaction; 
  onEdit: (transaction: Transaction) => void;
  onDelete: (transaction: Transaction) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    onEdit(transaction);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(false);
    onDelete(transaction);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <span className="sr-only">Abrir menu de ações</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-40"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        <DropdownMenuItem 
          onClick={handleEdit}
          className="cursor-pointer focus:bg-accent"
        >
          <Edit className="mr-2 h-4 w-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete}
          className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Apagar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Componente para confirmar exclusão
function DeleteConfirmDialog({ 
  isOpen, 
  onClose, 
  onConfirm, 
  transaction,
  isDeleting 
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  transaction: Transaction | null;
  isDeleting: boolean;
}) {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir a transação "{transaction?.description}"?
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} disabled={isDeleting}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export default function TransactionsPage() {
  const supabase = createClientComponentClient();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    transaction: Transaction | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    transaction: null,
    isDeleting: false
  });
  
  const formRef = useRef<HTMLFormElement>(null);
  
  const initialState = { message: "", errors: {}, success: false };
  const [state, formAction] = useFormState(createTransaction, initialState);

  const fetchData = useCallback(async (currentUserId: string) => {
    try {
      const { data: transData, error: transError } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });

      if (transError) {
        console.error('Erro ao buscar transações:', transError);
        toast.error('Erro ao carregar transações');
      } else {
        setTransactions(transData || []);
      }

      const { data: catData, error: catError } = await supabase
        .from('categories')
        .select('id, name')
        .eq('user_id', currentUserId);

      if (catError) {
        console.error('Erro ao buscar categorias:', catError);
        toast.error('Erro ao carregar categorias');
      } else {
        setCategories(catData || []);
      }
    } catch (error) {
      console.error('Erro geral:', error);
      toast.error('Erro ao carregar dados');
    }
  }, [supabase]);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          await fetchData(user.id);
        }
      } catch (error) {
        console.error('Erro ao verificar usuário:', error);
        toast.error('Erro de autenticação');
      } finally {
        setIsLoading(false);
      }
    };
    checkUser();
  }, [supabase, fetchData]);

  useEffect(() => {
    if (state.success) {
      setIsModalOpen(false);
      formRef.current?.reset();
      toast.success(state.message || 'Transação criada com sucesso!');
      if (userId) {
        fetchData(userId); // Recarregar dados após criar transação
      }
    } else if (state.message && !state.success) {
      toast.error(state.message);
    }
  }, [state, userId, fetchData]);

  const handleEdit = (transaction: Transaction) => {
    console.log('Editar transação:', transaction);
    toast.info('Função de edição em desenvolvimento');
    // Implementar lógica de edição aqui
  };

  const handleDelete = (transaction: Transaction) => {
    setDeleteDialog({
      isOpen: true,
      transaction,
      isDeleting: false
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.transaction) return;

    setDeleteDialog(prev => ({ ...prev, isDeleting: true }));

    try {
      const result = await deleteTransaction({ id: deleteDialog.transaction.id }) as ActionResult;
      
      if (result.success) {
        toast.success(result.message || 'Transação excluída com sucesso!');
        if (userId) {
          await fetchData(userId); // Recarregar dados
        }
        setDeleteDialog({
          isOpen: false,
          transaction: null,
          isDeleting: false
        });
      } else {
        toast.error(result.message || 'Erro ao excluir transação');
        setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
      }
    } catch (error) {
      console.error('Erro ao excluir:', error);
      toast.error('Erro ao excluir transação');
      setDeleteDialog(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const { incomeTransactions, expenseTransactions, totalIncome, totalExpenses, balance } = useMemo(() => {
    const incomeTransactions = transactions.filter(t => t.type === 'income');
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    
    const totalIncome = incomeTransactions.reduce((acc, t) => acc + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((acc, t) => acc + t.amount, 0);
    const balance = totalIncome - totalExpenses;

    return { incomeTransactions, expenseTransactions, totalIncome, totalExpenses, balance };
  }, [transactions]);
  
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando transações...</p>
        </div>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-500 mb-2">Utilizador não autenticado</p>
          <p className="text-muted-foreground text-sm">Por favor, faça login para continuar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Minhas Transações</h2>
          <p className="text-muted-foreground mt-2">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Adicionar Transação
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Transação</DialogTitle>
            </DialogHeader>
            <form ref={formRef} action={formAction}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="description" className="text-right">
                    Descrição
                  </Label>
                  <Input 
                    id="description" 
                    name="description" 
                    className="col-span-3" 
                    placeholder="Ex: Salário, Aluguel..."
                    required 
                  />
                  {state.errors?.description && (
                    <div className="col-span-4 text-sm text-red-600">
                      {state.errors.description[0]}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="amount" className="text-right">
                    Valor
                  </Label>
                  <Input 
                    id="amount" 
                    name="amount" 
                    type="number" 
                    step="0.01" 
                    className="col-span-3" 
                    placeholder="0,00"
                    required 
                  />
                  {state.errors?.amount && (
                    <div className="col-span-4 text-sm text-red-600">
                      {state.errors.amount[0]}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="date" className="text-right">
                    Data
                  </Label>
                  <Input 
                    id="date" 
                    name="date" 
                    type="date" 
                    className="col-span-3" 
                    defaultValue={new Date().toISOString().split('T')[0]} 
                    required 
                  />
                  {state.errors?.date && (
                    <div className="col-span-4 text-sm text-red-600">
                      {state.errors.date[0]}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="type" className="text-right">
                    Tipo
                  </Label>
                  <Select name="type" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  {state.errors?.type && (
                    <div className="col-span-4 text-sm text-red-600">
                      {state.errors.type[0]}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="categoryId" className="text-right">
                    Categoria
                  </Label>
                  <Select name="categoryId" required>
                    <SelectTrigger className="col-span-3">
                      <SelectValue placeholder="Selecione a categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {state.errors?.categoryId && (
                    <div className="col-span-4 text-sm text-red-600">
                      {state.errors.categoryId[0]}
                    </div>
                  )}
                </div>
              </div>
              {state.message && !state.success && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
                  <p className="text-sm text-red-600">{state.message}</p>
                </div>
              )}
              <DialogFooter className="mt-4">
                <DialogClose asChild>
                  <Button type="button" variant="outline">
                    Cancelar
                  </Button>
                </DialogClose>
                <SubmitButton />
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Card de Resumo */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/20 dark:to-indigo-950/20 border-blue-200 dark:border-blue-800">
        <CardHeader>
          <CardTitle className="text-blue-900 dark:text-blue-100">Resumo Financeiro</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-green-100 dark:bg-green-900/20">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Receitas</p>
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                R$ {totalIncome.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-red-100 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400 font-medium">Despesas</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                R$ {totalExpenses.toFixed(2)}
              </p>
            </div>
            <div className="text-center p-4 rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Saldo</p>
              <p className={`text-2xl font-bold ${balance >= 0 ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}`}>
                R$ {balance.toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid das transações */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Coluna de Receitas */}
        <Card className="border-green-500/20 bg-green-50/50 dark:bg-green-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600 dark:text-green-500">
              <ArrowUpCircle className="h-5 w-5" />
              Receitas
            </CardTitle>
            <CardDescription>Todas as suas entradas de dinheiro</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {incomeTransactions.length > 0 ? incomeTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.categories?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        + R$ {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <TransactionActions
                          transaction={transaction}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <ArrowUpCircle className="h-8 w-8 opacity-20" />
                          <span>Nenhuma receita registrada</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-green-600 dark:text-green-500">
                R$ {totalIncome.toFixed(2)}
              </span>
            </div>
          </CardFooter>
        </Card>

        {/* Coluna de Despesas */}
        <Card className="border-red-500/20 bg-red-50/50 dark:bg-red-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-500">
              <ArrowDownCircle className="h-5 w-5" />
              Despesas
            </CardTitle>
            <CardDescription>Todos os seus gastos</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-background">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Descrição</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenseTransactions.length > 0 ? expenseTransactions.map((transaction) => (
                    <TableRow key={transaction.id} className="group hover:bg-muted/50">
                      <TableCell className="font-medium">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {transaction.categories?.name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-medium text-red-600">
                        - R$ {transaction.amount.toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <TransactionActions
                          transaction={transaction}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </TableCell>
                    </TableRow>
                  )) : (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                        <div className="flex flex-col items-center gap-2">
                          <ArrowDownCircle className="h-8 w-8 opacity-20" />
                          <span>Nenhuma despesa registrada</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
          <CardFooter>
            <div className="flex w-full justify-between items-center text-lg font-bold">
              <span>Total:</span>
              <span className="text-red-600 dark:text-red-500">
                R$ {totalExpenses.toFixed(2)}
              </span>
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Dialog de confirmação de exclusão */}
      <DeleteConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, transaction: null, isDeleting: false })}
        onConfirm={confirmDelete}
        transaction={deleteDialog.transaction}
        isDeleting={deleteDialog.isDeleting}
      />
    </div>
  );
}