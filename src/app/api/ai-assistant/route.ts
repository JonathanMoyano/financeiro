import { createClient } from '@/lib/supabase/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { NextResponse } from 'next/server';

// Função para lidar com o pedido POST
export async function POST(req: Request) {
  console.log("API /api/ai-assistant foi chamada."); // Log de início

  try {
    const supabase = createClient();

    // 1. Obter o utilizador autenticado
    const { data, error: authError } = await supabase.auth.getUser();

    // --- LOGS DE DIAGNÓSTICO ---
    if (authError) {
      console.error("Erro de autenticação do Supabase:", authError.message);
    }
    if (!data.user) {
      console.log("Nenhum utilizador encontrado na sessão. Acesso não autorizado.");
    } else {
      console.log("Utilizador autenticado encontrado:", data.user.id);
    }
    // --- FIM DOS LOGS ---

    if (authError || !data.user) {
      return new NextResponse("Não autorizado", { status: 401 });
    }

    const user = data.user;

    // 2. Obter a pergunta do corpo do pedido
    const { question } = await req.json();
    if (!question) {
      return new NextResponse("A pergunta é obrigatória", { status: 400 });
    }

    // 3. Buscar as transações do utilizador no Supabase
    const { data: transactions, error: dbError } = await supabase
      .from('transactions')
      .select('description, amount, type, date')
      .eq('user_id', user.id)
      .limit(100);

    if (dbError) {
      console.error("Erro ao buscar transações:", dbError);
      return new NextResponse("Erro ao buscar dados financeiros", { status: 500 });
    }
    
    // 4. Formatar os dados para a IA
    const formattedTransactions = transactions.map(t => 
      `${t.date}: ${t.description} - R$ ${t.amount.toFixed(2)} (${t.type === 'expense' ? 'Despesa' : 'Receita'})`
    ).join('\n');

    // 5. Preparar e enviar o pedido para a IA do Google
    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
      Você é um assistente financeiro especialista. Analise os seguintes dados de transações de um utilizador e responda à pergunta dele de forma clara, objetiva e útil.
      
      **Dados das Transações:**
      ${formattedTransactions}

      **Pergunta do Utilizador:**
      "${question}"

      **Sua Resposta:**
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 6. Retornar a resposta da IA
    return NextResponse.json({ answer: text });

  } catch (error) {
    console.error("[AI_ASSISTANT_ERROR]", error);
    return new NextResponse("Erro interno do servidor", { status: 500 });
  }
}
