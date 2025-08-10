"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { PiggyBank, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Objeto de tradução para português
const pt = {
  sign_up: {
    email_label: "Endereço de e-mail",
    password_label: "Crie uma senha",
    email_input_placeholder: "O seu endereço de e-mail",
    password_input_placeholder: "A sua senha",
    button_label: "Criar conta",
    loading_button_label: "A criar conta...",
    social_provider_text: "Entrar com {{provider}}",
    link_text: "Não tem uma conta? Crie uma",
    confirmation_text: "Verifique o seu e-mail para o link de confirmação",
  },
  sign_in: {
    email_label: "Endereço de e-mail",
    password_label: "A sua senha",
    email_input_placeholder: "O seu endereço de e-mail",
    password_input_placeholder: "A sua senha",
    button_label: "Entrar",
    loading_button_label: "A entrar...",
    social_provider_text: "Entrar com {{provider}}",
    link_text: "Já tem uma conta? Entre",
  },
  magic_link: {
    email_input_label: "Endereço de e-mail",
    email_input_placeholder: "O seu endereço de e-mail",
    button_label: "Enviar link mágico",
    loading_button_label: "A enviar link mágico...",
    link_text: "Enviar um e-mail com link mágico",
    confirmation_text: "Verifique o seu e-mail para o link mágico",
  },
  forgotten_password: {
    email_label: "Endereço de e-mail",
    password_label: "A sua nova senha",
    email_input_placeholder: "O seu endereço de e-mail",
    button_label: "Enviar instruções de redefinição de senha",
    loading_button_label: "A enviar instruções...",
    link_text: "Esqueceu-se da sua senha?",
    confirmation_text: "Verifique o seu e-mail para o link de redefinição de senha",
  },
  update_password: {
    password_label: "Nova senha",
    password_input_placeholder: "A sua nova senha",
    button_label: "Atualizar senha",
    loading_button_label: "A atualizar senha...",
    confirmation_text: "A sua senha foi atualizada",
  },
  verify_otp: {
    email_input_label: 'Endereço de e-mail',
    email_input_placeholder: 'O seu endereço de e-mail',
    phone_input_label: 'Número de telemóvel',
    phone_input_placeholder: 'O seu número de telemóvel',
    token_input_label: 'Token',
    token_input_placeholder: 'O seu token OTP',
    button_label: 'Verificar token',
    loading_button_label: 'A entrar...',
  },
};

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  // Função para obter o URL base de forma segura
  const getURL = () => {
    let url =
      process.env.NEXT_PUBLIC_SITE_URL || // Definido por si
      process.env.NEXT_PUBLIC_VERCEL_URL || // Definido pela Vercel
      'http://localhost:3000';
    url = url.includes('http') ? url : `https://${url}`;
    return url;
  };

  // Verificar se o utilizador já está autenticado
  useEffect(() => {
    const checkUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        router.push('/dashboard');
      }
    };
    
    checkUser();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, 'Session:', session);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('Utilizador autenticado, redirecionando...');
          router.push('/dashboard');
        }
        
        if (event === 'SIGNED_OUT') {
          console.log('Utilizador deslogado');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [supabase, router]);

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
        {/* Logo + Voltar */}
        <div className="flex items-center gap-2 mb-8 text-white">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para início
          </Link>
        </div>

        {/* Card de login */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <PiggyBank className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Meu Financeiro</h1>
            </div>
            <p className="text-gray-300">
              Aceda à sua conta para continuar
            </p>
          </div>

          <Auth
            supabaseClient={supabase}
            appearance={{
              theme: ThemeSupa,
              style: {
                button: { 
                  borderRadius: "0.5rem", 
                  padding: "0.75rem",
                  backgroundColor: "#10b981",
                  border: "none",
                  color: "white"
                },
                input: { 
                  borderRadius: "0.5rem", 
                  padding: "0.75rem",
                  backgroundColor: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  color: "white"
                },
                label: { 
                  color: "white",
                  marginBottom: "0.5rem"
                },
                anchor: {
                  color: "#10b981"
                },
                message: {
                  color: "#ef4444"
                }
              },
            }}
            theme="dark"
            providers={[]}
            redirectTo={`${getURL()}/auth/callback`}
            view="sign_in"
            localization={{ variables: pt }}
            showLinks={true}
          />

          <div className="mt-6 flex flex-col items-center text-sm text-gray-300 space-y-2">
            <Link href="/sign-up" className="hover:underline text-emerald-400">
              Criar conta grátis
            </Link>
            <Link
              href="/forgot-password"
              className="hover:underline text-gray-400"
            >
              Esqueceu-se da sua senha?
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}