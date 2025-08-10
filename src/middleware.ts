// Local: src/middleware.ts

import { NextResponse, type NextRequest } from 'next/server'
// Importa a função "ajudante" que criamos no passo anterior.
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  // Executa o ajudante para obter o cliente Supabase e a resposta.
  const { supabase, response } = createClient(request)

  // Atualiza a sessão do usuário a cada requisição.
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Lógica para proteger as rotas da sua plataforma
  if (!session && pathname.startsWith('/platform')) {
    // Se o usuário não está logado e tenta acessar a plataforma,
    // redireciona para a página de login.
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Lógica para redirecionar usuários já logados
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/sign-up'))) {
    // Se o usuário já está logado e tenta acessar a página de login/cadastro,
    // redireciona para o dashboard.
    const url = request.nextUrl.clone()
    url.pathname = '/platform/dashboard'
    return NextResponse.redirect(url)
  }

  // Se nenhuma das condições acima for atendida, continua a navegação.
  return response
}

// Configuração para dizer ao Next.js em quais rotas o middleware deve rodar.
export const config = {
  matcher: [
    /*
     * Corresponde a todas as rotas, exceto as pastas de sistema do Next.js
     * e arquivos estáticos como o favicon.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}