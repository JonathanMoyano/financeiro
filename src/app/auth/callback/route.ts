// app/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')
  const origin = requestUrl.origin

  console.log('Callback recebido:', { code: !!code, type, origin })

  if (code) {
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
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (error) {
        console.error('Erro ao trocar código por sessão:', error)
        return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Erro de autenticação: ' + error.message)}`)
      }

      console.log('Sessão criada com sucesso:', { user: data.user?.email })

      // Se o tipo for 'recovery', é um fluxo de recuperação de senha
      if (type === 'recovery') {
        return NextResponse.redirect(`${origin}/configuracoes/perfil`)
      }

      // Para login/cadastro normal, redireciona para o dashboard
      return NextResponse.redirect(`${origin}/dashboard`)
      
    } catch (error) {
      console.error('Erro inesperado no callback:', error)
      return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Erro inesperado durante a autenticação')}`)
    }
  }

  // Se não houver código, redireciona para login
  console.warn('Callback sem código de autorização')
  return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent('Código de autorização em falta')}`)
}