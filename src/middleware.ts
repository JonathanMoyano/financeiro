import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { data: { session } } = await supabase.auth.getSession()
  const { pathname } = request.nextUrl

  // Lógica para proteger as rotas da sua plataforma
  if (!session && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Lógica para redirecionar usuários já logados
  // CORREÇÃO: Adicionar exceção para a página de redefinição de senha
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/sign-up')) && !pathname.startsWith('/auth/reset-password')) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Permitir acesso às rotas de autenticação sem redirecionamento
  if (pathname.startsWith('/auth/')) {
    return response
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}