import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { pathname } = request.nextUrl
  
  // --- CORREÇÃO APLICADA AQUI ---
  // Trocamos getSession() por getUser() para validar a sessão com o servidor.
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error) {
    console.error('❌ Erro ao obter usuário no middleware:', error.message)
  }
  
  // A lógica agora usa 'user' em vez de 'session'
  const isLoggedIn = !!user;
  
  console.log(`🔄 Middleware: [${request.method}] ${pathname} | Logado: ${isLoggedIn ? 'Sim' : 'Não'}`);

  // --- O RESTO DA LÓGICA PERMANECE IGUAL, APENAS AJUSTADA PARA USAR 'isLoggedIn' ---

  // Se está tentando acessar o dashboard e não está logado, redireciona para o login
  if (pathname.startsWith('/dashboard') && !isLoggedIn) {
    console.log('🔒 Acesso negado ao /dashboard. Redirecionando para /login.');
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Se já está logado e tenta acessar /login ou /sign-up, redireciona para o dashboard
  if (isLoggedIn && (pathname.startsWith('/login') || pathname.startsWith('/sign-up'))) {
    console.log('🔄 Usuário já logado. Redirecionando para /dashboard.');
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }
  
  // Se está na raiz e logado, vai para o dashboard
  if (pathname === '/' && isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Se está na raiz e não logado, vai para o login
  if (pathname === '/' && !isLoggedIn) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Permite a passagem para as outras rotas
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}
