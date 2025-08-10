"use server";

import { createClient } from "@/lib/supabase/server";
import { subDays, formatISO } from 'date-fns';

/**
 * Busca as transações do tipo 'expense' que estão para vencer nos próximos 30 dias.
 * @returns Uma lista de transações a vencer.
 */
export async function getUpcomingBills() {
  const supabase = createClient();

  // Pega o usuário atual da sessão
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Se não houver usuário, retorna um array vazio
    return [];
  }

  // Define o período de busca: de hoje até 30 dias no futuro
  const today = new Date();
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(today.getDate() + 30);

  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('id, description, amount, date')
      .eq('user_id', user.id) // Filtra pelo usuário logado
      .eq('type', 'expense') // Apenas despesas
      .gte('date', formatISO(today, { representation: 'date' })) // A partir de hoje
      .lte('date', formatISO(thirtyDaysFromNow, { representation: 'date' })) // Até 30 dias no futuro
      .order('date', { ascending: true }); // Ordena pela data de vencimento

    if (error) {
      console.error("Erro ao buscar contas a vencer:", error.message);
      throw new Error("Não foi possível carregar as notificações.");
    }

    return data;

  } catch (error) {
    console.error("Erro inesperado na Server Action:", error);
    return []; // Retorna um array vazio em caso de erro
  }
}
