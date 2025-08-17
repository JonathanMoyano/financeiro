import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { Database } from './types'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANTE: refreshing the auth tokens
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rotas baseadas na sua estrutura completa
  const protectedRoutes = [
    '/dashboard',
    '/despesas', 
    '/poupanca', 
    '/relatorios',
    '/configuracoes'
  ]
  
  const authRoutes = [
    '/login', 
    '/sign-up', 
    '/update-password'
  ]

  // Verificar rotas com grupos
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route)) ||
                          pathname.startsWith('/(platform)')
                          
  const isAuthRoute = authRoutes.some(route => pathname.startsWith(route)) ||
                     pathname.startsWith('/(auth)') ||
                     pathname.startsWith('/auth/') // para callback, forgot-password, reset-password

  // Permitir acesso às rotas de callback e reset sem autenticação
  const isCallbackRoute = pathname.startsWith('/auth/callback') ||
                         pathname.startsWith('/auth/forgot-password') ||
                         pathname.startsWith('/auth/reset-password')

  console.log(`🔄 Middleware: [${request.method}] ${pathname} | User: ${user ? 'Yes' : 'No'}`)

  // Não redirecionar rotas de callback
  if (isCallbackRoute) {
    return supabaseResponse
  }

  // Redirecionar usuários não autenticados para login
  if (isProtectedRoute && !user) {
    console.log('🔒 Access denied. Redirecting to /login.')
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirecionar usuários autenticados para dashboard
  if (isAuthRoute && user && !isCallbackRoute) {
    console.log('🔄 User already logged in. Redirecting to /dashboard.')
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

  // Redirecionar da raiz
  if (pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = user ? '/dashboard' : '/login'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}