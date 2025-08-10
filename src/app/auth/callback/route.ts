// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')
  const origin = requestUrl.origin

  // Log detalhado para debug
  console.log('=== CALLBACK DEBUG ===')
  console.log('URL completa:', request.url)
  console.log('Parâmetros:', {
    code: code ? `${code.substring(0, 10)}...` : 'null',
    error,
    error_description,
    allParams: Object.fromEntries(requestUrl.searchParams.entries())
  })

  // Se houver erro explícito, redirecionar
  if (error) {
    console.error('Erro no callback:', { error, error_description })
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(error_description || error)}`)
  }

  // Se não houver código, é um problema
  if (!code) {
    console.error('Callback sem código de autorização')
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Código de autorização em falta')}`)
  }

  // Criar cliente Supabase
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )

  try {
    console.log('Tentando trocar código por sessão...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (exchangeError) {
      console.error('Erro ao trocar código:', exchangeError)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Erro de autenticação: ' + exchangeError.message)}`)
    }

    if (!data.session || !data.user) {
      console.error('Sessão ou usuário não criados')
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Falha ao criar sessão')}`)
    }

    console.log('Sessão criada com sucesso:', {
      userId: data.user.id,
      email: data.user.email,
      hasSession: !!data.session
    })

    // Verificar se é fluxo de recovery
    // O Supabase pode indicar isso através do contexto da URL original
    const isPasswordReset = requestUrl.searchParams.has('type') && requestUrl.searchParams.get('type') === 'recovery'
    
    if (isPasswordReset) {
      console.log('Detectado fluxo de recovery, redirecionando para reset-password')
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    // Verificar se o usuário precisa atualizar a senha (indicador de recovery)
    const userMetadata = data.user.user_metadata || {}
    const appMetadata = data.user.app_metadata || {}
    
    if (appMetadata.provider === 'email' && !userMetadata.email_verified) {
      console.log('Usuário parece estar em fluxo de recovery, redirecionando para reset-password')
      return NextResponse.redirect(`${origin}/auth/reset-password`)
    }

    // Se chegou aqui, é login normal
    console.log('Redirecionando para dashboard')
    return NextResponse.redirect(`${origin}/dashboard`)

  } catch (error) {
    console.error('Erro inesperado no callback:', error)
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Erro inesperado durante a autenticação')}`)
  }
}