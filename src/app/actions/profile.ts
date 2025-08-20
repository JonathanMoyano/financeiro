"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

// =================================================================
// ESQUEMAS DE VALIDAÇÃO
// =================================================================

const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres." }),
});

const updatePasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "A senha deve ter no mínimo 8 caracteres." }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

// =================================================================
// SERVER ACTIONS
// =================================================================

export async function updateProfile(prevState: any, formData: FormData) {
  // 1. Cria o cliente Supabase para Server Actions
  // CORREÇÃO: Aguarda a criação do cliente Supabase
  const supabase = await createClient();

  // 2. Obtém a sessão do usuário logado
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      message: "Usuário não autenticado. Por favor, faça login novamente.",
    };
  }
  console.log(`Iniciando atualização de perfil para o usuário: ${user.id}`);

  // 3. Valida os dados recebidos do formulário
  const validatedFields = updateProfileSchema.safeParse({
    fullName: formData.get("fullName"),
  });

  if (!validatedFields.success) {
    console.error(
      "❌ Erro de validação:",
      validatedFields.error.flatten().fieldErrors
    );
    return {
      success: false,
      message: "Dados inválidos. Por favor, corrija os erros abaixo.",
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { fullName } = validatedFields.data;
  console.log(`Nome validado: "${fullName}"`);

  // Adicionamos um log mais detalhado e separamos a captura de dados e erros.
  const { data: updatedProfile, error: profileError } = await supabase
    .from("profiles")
    .upsert({
      id: user.id, // 'id' é essencial para o upsert saber qual linha criar/atualizar
      full_name: fullName,
      updated_at: new Date().toISOString(),
    })
    .select() // Retorna os dados que foram atualizados/inseridos
    .single();

  if (profileError) {
    console.error("❌ Erro no upsert do perfil:", profileError);
    return {
      success: false,
      // Fornece uma mensagem de erro mais útil, sugerindo a causa mais comum (RLS)
      message: `Erro no banco de dados: ${profileError.message}. Verifique as políticas de segurança (RLS) da tabela 'profiles'.`,
    };
  }

  console.log(
    "✅ Perfil atualizado com sucesso na tabela 'profiles':",
    updatedProfile
  );

  // Sincroniza o nome nos metadados do usuário na tabela 'auth.users'
  const { error: authUserError } = await supabase.auth.updateUser({
    data: {
      full_name: fullName,
    },
  });

  if (authUserError) {
    console.warn(
      `Aviso: O perfil foi atualizado, mas falhou ao sincronizar com auth.users: ${authUserError.message}`
    );
  } else {
    console.log("✅ Metadados do usuário sincronizados em 'auth.users'.");
  }

  // Revalida o cache da página e retorna sucesso
  revalidatePath("/configuracoes/perfil");
  return {
    success: true,
    message: "Perfil atualizado com sucesso!",
  };
}

export async function updatePassword(prevState: any, formData: FormData) {
  // CORREÇÃO: Aguarda a criação do cliente Supabase
  const supabase = await createClient();

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

  return {
    success: true,
    message:
      "Senha atualizada com sucesso! Você pode ser desconectado de outros dispositivos.",
  };
}
