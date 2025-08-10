"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { PiggyBank, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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
};

export default function SignUpPage() {
  const supabase = createClient();

  // Função para obter o URL base de forma segura
  const getURL = () => {
    let url =
      process.env.NEXT_PUBLIC_SITE_URL || // Definido por si
      process.env.NEXT_PUBLIC_VERCEL_URL || // Definido pela Vercel
      'https://financeiro-amber.vercel.app/sign-up';
    url = url.includes('http') ? url : `https://${url}`;
    return url;
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      {/* Background pattern */}
      <div
        className="absolute inset-0 opacity-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%239C92AC' fill-opacity='0.4'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%E3C/g%3E%3C/svg%3E")`,
        }}
      ></div>

      <div className="relative z-10 w-full max-w-md">
        {/* Voltar */}
        <div className="flex items-center gap-2 mb-8 text-white">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para início
          </Link>
        </div>

        {/* Card de cadastro */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <PiggyBank className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Meu Financeiro</h1>
            </div>
            <p className="text-gray-300">
              Crie sua conta para organizar suas finanças
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
            redirectTo={`${getURL()}/auth/callback`}
            view="sign_up"
            localization={{ variables: pt }}
            showLinks={false}
          />

          <div className="mt-6 flex flex-col items-center text-sm text-gray-300">
            <Link href="/login" className="hover:underline text-emerald-400">
              Já tem uma conta? Entrar
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
