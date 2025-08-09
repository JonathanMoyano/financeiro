import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { question } = await request.json();

  if (!question) {
    return NextResponse.json({ error: 'Pergunta é obrigatória' }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  // 1. Buscar os dados financeiros do usuário
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('description, amount, type, date')
    .eq('user_id', session.user.id)
    .limit(50); // Limita a 50 transações recentes para a análise

  if (error) {
    return NextResponse.json({ error: 'Erro ao buscar dados' }, { status: 500 });
  }

  // 2. Montar o prompt para a IA (exemplo com Gemini)
  // **IMPORTANTE**: Para isso funcionar, você precisaria de uma API Key do Google AI Studio
  const prompt = `
    Você é um assistente financeiro especialista. Analise os seguintes dados de transações de um usuário e responda à pergunta dele de forma clara e útil.

    Dados das transações:
    ${JSON.stringify(transactions, null, 2)}

    Pergunta do usuário: "${question}"

    Sua resposta:
  `;

  // 3. Simular uma resposta da IA (substitua pela chamada real da API)
  const aiResponse = `Analisando seus gastos recentes, percebi que uma parte significativa das suas despesas está na categoria "Alimentação". Para economizar, você poderia tentar:\n1. Cozinhar mais em casa durante a semana.\n2. Planejar suas compras no supermercado com uma lista para evitar compras por impulso.\n3. Aproveitar promoções e cupons de desconto.`;

  return NextResponse.json({ answer: aiResponse });
}
