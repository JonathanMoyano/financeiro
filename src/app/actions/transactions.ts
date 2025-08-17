"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// =================================================================
// 1. AÇÃO PARA CRIAR UMA NOVA TRANSAÇÃO
// =================================================================
const createTransactionSchema = z.object({
  description: z.string().min(1, { message: "Descrição é obrigatória." }),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }),
  type: z.enum(["income", "expense"], { required_error: "Tipo é obrigatório." }),
  date: z.coerce.date(),
  categoryId: z.string().uuid({ message: "Por favor, selecione uma categoria." }).optional().or(z.literal('')),
});

export async function createTransaction(prevState: any, formData: FormData) {
  const supabase = await createClient();

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
    category_id: categoryId || null,
  });

  if (error) {
    console.error("Supabase error creating transaction:", error);
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
  description: z.string().min(1, { message: "Descrição é obrigatória." }).optional(),
  amount: z.coerce.number().positive({ message: "O valor deve ser positivo." }).optional(),
  type: z.enum(['income', 'expense']).optional(),
  date: z.coerce.date().optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export async function updateTransaction(input: z.infer<typeof updateTransactionSchema>) {
  const supabase = await createClient();
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

  const { id, ...dataToUpdate } = validatedFields.data;

  // Converte a data para o formato ISO string se ela existir
  const updatePayload = {
    ...dataToUpdate,
    date: dataToUpdate.date ? dataToUpdate.date.toISOString() : undefined,
    category_id: dataToUpdate.categoryId,
  };
  // Remove categoryId para evitar conflito com category_id
  delete (updatePayload as any).categoryId;

  const { error } = await supabase
    .from('transactions')
    .update(updatePayload)
    .eq('user_id', user.id)
    .eq('id', id);

  if (error) {
    console.error("Supabase error updating transaction:", error);
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

export async function deleteTransaction(input: { id: string }) {
  const supabase = await createClient();
  const validatedInput = deleteTransactionSchema.safeParse(input);

  if (!validatedInput.success) {
    return { success: false, message: "ID da transação inválido." };
  }

  const { id } = validatedInput.data;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Ação não autorizada." };
  }

  const { error } = await supabase
    .from("transactions")
    .delete()
    .eq("user_id", user.id)
    .eq("id", id);

  if (error) {
    console.error("Erro ao apagar transação:", error);
    return { success: false, message: "Não foi possível apagar a transação." };
  }

  revalidatePath("/despesas");
  revalidatePath("/dashboard");

  return { success: true, message: "Transação excluída com sucesso!" };
}