// src/app/actions/profile.ts
"use server";

import { revalidatePath } from "next/cache";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { z } from "zod";
import { Database } from "@/lib/database.types";

// =================================================================
// 1. AÇÃO PARA ATUALIZAR OS DADOS DO PERFIL (NOME)
// =================================================================
const updateProfileSchema = z.object({
  fullName: z.string().min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});

export async function updateProfile(prevState: any, formData: FormData) {
  const supabase = createServerActionClient<Database>({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Utilizador não autenticado." };
  }

  const validatedFields = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!validatedFields.success) {
    return {
      success: false,
      message: "Dados inválidos.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName } = validatedFields.data;

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      message: `Erro ao atualizar o perfil: ${error.message}`,
    };
  }

  revalidatePath("/perfil");
  return { success: true, message: "Perfil atualizado com sucesso!" };
}


// =================================================================
// 2. AÇÃO PARA ATUALIZAR A SENHA
// =================================================================
const updatePasswordSchema = z.object({
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "As senhas não coincidem.",
  path: ["confirmPassword"], // O erro será associado a este campo
});


export async function updatePassword(prevState: any, formData: FormData) {
    const supabase = createServerActionClient({ cookies });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, message: "Utilizador não autenticado." };
    }

    const validatedFields = updatePasswordSchema.safeParse({
        password: formData.get("password"),
        confirmPassword: formData.get("confirmPassword"),
    });

    if (!validatedFields.success) {
        return {
            success: false,
            message: "Dados inválidos.",
            errors: validatedFields.error.flatten().fieldErrors,
        };
    }

    const { password } = validatedFields.data;

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
        return {
            success: false,
            message: `Erro ao atualizar a senha: ${error.message}`,
        };
    }

    return { success: true, message: "Senha atualizada com sucesso!" };
}
