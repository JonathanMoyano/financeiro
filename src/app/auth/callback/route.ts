import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const type = requestUrl.searchParams.get('type');

  if (code) {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    try {
      await supabase.auth.exchangeCodeForSession(code);
    } catch (error) {
      console.error('Erro ao trocar código por sessão:', error);
    }
  }

  // Verificar o tipo de callback
  if (type === 'recovery') {
    // Redirecionar para a página de redefinição de senha
    return NextResponse.redirect(new URL('/auth/update-password', requestUrl.origin));
  }

  // Redirecionar para o dashboard após login normal
  return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
}