import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')

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
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // Se o tipo for 'recovery', é um fluxo de recuperação de senha.
      if (type === 'recovery') {
        // Redireciona para a página de perfil para o utilizador definir uma nova senha.
        return NextResponse.redirect(`${origin}/configuracoes/perfil`)
      }
      // Para login/cadastro normal, redireciona para o dashboard.
      return NextResponse.redirect(`${origin}/dashboard`)
    }
  }

  // Se houver um erro, redireciona para a página de login com uma mensagem.
  console.error("Erro no callback de autenticação:", "Código inválido ou em falta.");
  return NextResponse.redirect(`${origin}/login?error=Não foi possível autenticar. O link pode ter expirado.`)
}
