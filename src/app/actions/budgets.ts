"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { Database } from "@/lib/database.types";

// Schema para criar um orçamento
const createBudgetSchema = z.object({
  amount: z.coerce.number().positive({ message: "O valor do orçamento deve ser positivo." }),
  categoryId: z.string().uuid({ message: "Por favor, selecione uma categoria." }),
});

// Schema para atualizar um orçamento
const updateBudgetSchema = z.object({
  amount: z.coerce.number().positive({ message: "O valor do orçamento deve ser positivo." }),
  budgetId: z.string().uuid(),
});

// --- FUNÇÃO DE CRIAR (já existente) ---
export async function createBudget(formData: FormData) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Utilizador não autenticado." };

  const validatedFields = createBudgetSchema.safeParse({
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
  });

  if (!validatedFields.success) {
    return { success: false, message: "Dados inválidos." };
  }
  const { amount, categoryId } = validatedFields.data;
  
  const today = new Date();
  const month = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();

  const { error } = await supabase.from('budgets').insert({
    user_id: user.id,
    category_id: categoryId,
    amount: amount,
    month: month,
  });

  if (error) {
    if (error.code === '23505') {
      return { success: false, message: "Já existe um orçamento para esta categoria neste mês." };
    }
    return { success: false, message: `Erro ao criar orçamento: ${error.message}` };
  }
  revalidatePath('/orcamentos');
  return { success: true, message: "Orçamento criado com sucesso!" };
}

// --- NOVA FUNÇÃO DE ATUALIZAR ---
export async function updateBudget(formData: FormData) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Utilizador não autenticado." };

  const validatedFields = updateBudgetSchema.safeParse({
    amount: formData.get('amount'),
    budgetId: formData.get('budgetId'),
  });

  if (!validatedFields.success) {
    return { success: false, message: "Dados inválidos." };
  }
  const { amount, budgetId } = validatedFields.data;

  const { error } = await supabase
    .from('budgets')
    .update({ amount })
    .eq('id', budgetId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, message: `Erro ao atualizar orçamento: ${error.message}` };
  }
  revalidatePath('/orcamentos');
  return { success: true, message: "Orçamento atualizado com sucesso!" };
}

// --- NOVA FUNÇÃO DE EXCLUIR ---
export async function deleteBudget(budgetId: string) {
  const supabase = createServerComponentClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, message: "Utilizador não autenticado." };

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id);

  if (error) {
    return { success: false, message: `Erro ao excluir orçamento: ${error.message}` };
  }
  revalidatePath('/orcamentos');
  return { success: true, message: "Orçamento excluído com sucesso!" };
}
