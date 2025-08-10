import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/middleware'

export async function middleware(request: NextRequest) {
  const { supabase, response } = createClient(request)
  const { pathname } = request.nextUrl
  
  // PRIMEIRO: Sempre permitir rotas de autenticação (callback, reset-password, etc.)
  if (pathname.startsWith('/auth/')) {
    return response
  }

  // Obter sessão apenas após verificar se não é rota de auth
  const { data: { session } } = await supabase.auth.getSession()

  // Proteger rotas do dashboard
  if (!session && pathname.startsWith('/dashboard')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionar usuários já logados das páginas de login/signup
  if (session && (pathname.startsWith('/login') || pathname.startsWith('/sign-up'))) {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api/).*)',
  ],
}