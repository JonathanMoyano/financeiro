"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Loader2 } from "lucide-react";
import { toast } from "sonner";

// CORREÇÃO: Importa a biblioteca moderna do Supabase e os tipos do DB.
import { createBrowserClient } from '@supabase/ssr';
import { Database } from "@/lib/database.types";

import { updateTransaction } from "@/app/actions/transactions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Tipos e Props
type Category = {
  id: string;
  name: string;
}

interface EditTransactionFormProps {
  transactionId?: string;
  categories: Category[];
  onClose: () => void;
}

// Schema de Validação Zod
const formSchema = z.object({
  description: z.string().min(1, { message: "Descrição é obrigatória." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser um número positivo." }),
  type: z.enum(['income', 'expense']),
  date: z.date({ required_error: "A data é obrigatória." }),
  categoryId: z.string().uuid().optional().nullable(),
});

type FormValues = z.infer<typeof formSchema>;

// Componente do Formulário de Edição
export function EditTransactionForm({ transactionId, categories, onClose }: EditTransactionFormProps) {
  // CORREÇÃO: Cria o cliente Supabase de forma estável, apenas uma vez.
  const [supabase] = React.useState(() =>
    createBrowserClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  );
  
  const [isLoading, setIsLoading] = React.useState(true);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // Busca os dados da transação quando o componente é montado
  React.useEffect(() => {
    if (!transactionId) {
        setIsLoading(false);
        return;
    };

    const fetchTransaction = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
            .from("transactions")
            .select("description, amount, type, date, category_id")
            .eq("id", transactionId)
            .single();

        if (error) throw error;

        if (data) {
            form.reset({
                description: data.description || '',
                amount: data.amount,
                type: data.type as 'income' | 'expense',
                date: new Date(data.date),
                categoryId: data.category_id,
            });
        }
      } catch (error) {
        console.error("Erro ao buscar dados da transação:", error);
        toast.error("Não foi possível carregar os dados da transação.");
        onClose(); // Fecha o modal em caso de erro
      } finally {
        setIsLoading(false);
      }
    };

    fetchTransaction();
  }, [transactionId, supabase, form, onClose]);

  // Função para submeter as alterações
  const onSubmit = async (data: FormValues) => {
    if (!transactionId) return;
    setIsSubmitting(true);

    try {
      const result = await updateTransaction({ id: transactionId, ...data });
      if (result.success) {
        toast.success(result.message || "Transação atualizada com sucesso!");
        onClose();
      } else {
        toast.error(result.message || "Ocorreu um erro ao atualizar a transação.");
      }
    } catch (error) {
      toast.error("Ocorreu um erro inesperado. Tente novamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Descrição</FormLabel>
              <FormControl><Input placeholder="Ex: Salário, Aluguel" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Valor</FormLabel>
              <FormControl><Input type="number" step="0.01" placeholder="R$ 0,00" {...field} /></FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="date"
          render={({ field }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Data</FormLabel>
              <Popover>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant={"outline"}
                      className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                    >
                      {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Escolha uma data</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                </PopoverContent>
              </Popover>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    <SelectItem value="expense">Despesa</SelectItem>
                    <SelectItem value="income">Receita</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Categoria</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ""}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Selecione (opcional)..." /></SelectTrigger></FormControl>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>{category.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Salvar Alterações
            </Button>
        </div>
      </form>
    </Form>
  )
}