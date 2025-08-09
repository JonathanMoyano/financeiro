// src/app/actions/transactions.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { Database } from "@/lib/database.types";

// =================================================================
// 1. AÇÃO PARA CRIAR UMA NOVA TRANSAÇÃO
// =================================================================
const createTransactionSchema = z.object({
  description: z.string().min(1, { message: "Descrição é obrigatória." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  type: z.enum(["income", "expense"], { required_error: "Tipo é obrigatório."}),
  date: z.coerce.date(),
  categoryId: z.string().uuid({ message: "Por favor, selecione uma categoria." }).optional().or(z.literal('')),
});

// CORREÇÃO: A função agora aceita 'prevState' como o primeiro argumento.
export async function createTransaction(prevState: any, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Utilizador não autenticado." };
  }

  const validatedFields = createTransactionSchema.safeParse({
    description: formData.get("description"),
    amount: formData.get("amount"),
    type: formData.get("type"),
    date: formData.get("date"),
    categoryId: formData.get("categoryId") || undefined,
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Dados inválidos. Verifique os campos.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { description, amount, type, date, categoryId } = validatedFields.data;

  const { error } = await supabase.from("transactions").insert({
    user_id: user.id,
    description,
    amount,
    type,
    date: date.toISOString(),
    // Garante que o categoryId seja null se não for fornecido
    category_id: categoryId || null,
  });

  if (error) {
    return {
      success: false,
      message: `Erro ao criar transação: ${error.message}`,
    };
  }

  revalidatePath("/despesas");
  revalidatePath("/dashboard");
  return { success: true, message: "Transação criada com sucesso!" };
}

// =================================================================
// 2. AÇÃO PARA ATUALIZAR UMA TRANSAÇÃO EXISTENTE
// =================================================================
const updateTransactionSchema = z.object({
  id: z.string().uuid(),
  description: z.string().min(1, { message: "Descrição é obrigatória." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  type: z.enum(['income', 'expense']),
  date: z.date(),
  categoryId: z.string().uuid().optional().nullable(),
});

export async function updateTransaction(input: z.infer<typeof updateTransactionSchema>) {
    const supabase = createServerActionClient<Database>({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Utilizador não autenticado." };
    }

    const validatedFields = updateTransactionSchema.safeParse(input);

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Dados de atualização inválidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { id, description, amount, type, date, categoryId } = validatedFields.data;

    const { error } = await supabase
        .from('transactions')
        .update({
            description,
            amount,
            type,
            date: date.toISOString(),
            category_id: categoryId,
        })
        .eq('user_id', user.id)
        .eq('id', id);

    if (error) {
        return { success: false, message: `Erro ao atualizar transação: ${error.message}` };
    }

    revalidatePath('/despesas');
    revalidatePath('/dashboard');
    return { success: true, message: "Transação atualizada com sucesso!" };
}


// =================================================================
// 3. AÇÃO PARA APAGAR UMA TRANSAÇÃO
// =================================================================
const deleteTransactionSchema = z.object({
  id: z.string().uuid("ID da transação inválido."),
});

export const deleteTransaction = async (input: { id: string }) => {
  const supabase = createServerActionClient<Database>({ cookies });
  const validatedInput = deleteTransactionSchema.safeParse(input);

  if (!validatedInput.success) {
    throw new Error("Input inválido.");
  }

  const { id } = validatedInput.data;
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Ação não autorizada.");
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", session.user.id)
    .eq("id", id);

  if (error) {
    console.error("Erro ao apagar transação:", error);
    throw new Error("Não foi possível apagar a transação.");
  }

  revalidatePath("/despesas");
  revalidatePath("/dashboard");

  return {
    success: true,
  };
};
