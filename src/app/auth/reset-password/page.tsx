"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { PiggyBank, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";

// Objeto de tradução para português
const pt = {
  update_password: {
    password_label: "Nova senha",
    password_input_placeholder: "Digite sua nova senha",
    button_label: "Atualizar senha",
    loading_button_label: "Atualizando...",
    confirmation_text: "Sua senha foi atualizada",
  },
};

// Componente interno que usa useSearchParams
function ResetPasswordContent() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handlePasswordReset = async () => {
      // Pegar o código da URL (se vier diretamente do email)
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        setError('Erro no link de redefinição de senha');
        setLoading(false);
        return;
      }

      if (code) {
        try {
          console.log('Processando código de reset de senha:', code.substring(0, 10) + '...');
          
          // Trocar o código por uma sessão
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Erro ao trocar código:', exchangeError);
            setError('Link de redefinição inválido ou expirado');
            setLoading(false);
            return;
          }

          if (data.session) {
            console.log('Sessão criada com sucesso para reset de senha');
            // A sessão foi criada, agora podemos mostrar o formulário de update_password
            setLoading(false);
          }
        } catch (error) {
          console.error('Erro inesperado:', error);
          setError('Erro inesperado. Tente solicitar um novo link.');
          setLoading(false);
        }
      } else {
        // Não há código na URL, verificar se já tem sessão
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setLoading(false);
        } else {
          setError('Link de redefinição inválido. Solicite um novo link.');
          setLoading(false);
        }
      }
    };

    handlePasswordReset();
  }, [searchParams, supabase]);

  useEffect(() => {
    // Escuta mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        console.log("Password recovery event detected");
        setLoading(false);
      }
      
      if (event === "SIGNED_IN" && session) {
        // Usuário redefiniu a senha com sucesso
        console.log("Password updated successfully, redirecting...");
        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  if (loading) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p>Validando link de redefinição...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
        <div className="relative z-10 w-full max-w-md">
          <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
            <div className="mb-6 text-center">
              <PiggyBank className="w-10 h-10 text-emerald-400 mx-auto mb-3" />
              <h1 className="text-2xl font-bold text-white mb-3">Erro</h1>
              <p className="text-red-400 mb-4">{error}</p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-emerald-400 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Voltar */}
        <div className="flex items-center gap-2 mb-8 text-white">
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o login
          </Link>
        </div>

        {/* Card de nova senha */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <PiggyBank className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Meu Financeiro</h1>
            </div>
            <p className="text-gray-300">
              Digite sua nova senha
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#10b981',
                    brandAccent: '#059669',
                    defaultButtonBackground: '#10b981',
                    defaultButtonBackgroundHover: '#059669',
                    inputBackground: 'rgba(255, 255, 255, 0.05)',
                    inputBorder: 'rgba(255, 255, 255, 0.2)',
                    inputBorderHover: 'rgba(255, 255, 255, 0.4)',
                    inputBorderFocus: '#10b981',
                    inputText: 'white',
                    inputLabelText: 'white',
                    inputPlaceholder: '#a1a1aa',
                  },
                  radii: {
                    buttonBorderRadius: '0.5rem',
                    inputBorderRadius: '0.5rem',
                  }
                }
              }
            }}
            theme="dark"
            providers={[]}
            view="update_password"
            localization={{ variables: pt }}
            showLinks={false}
          />
        </div>
      </div>
    </div>
  );
}

// Loading component para o Suspense
function ResetPasswordLoading() {
  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      <div className="text-white text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
        <p>Carregando...</p>
      </div>
    </div>
  );
}

// Componente principal exportado com Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordLoading />}>
      <ResetPasswordContent />
    </Suspense>
  );
}