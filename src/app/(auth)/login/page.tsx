"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { PiggyBank, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";

// Objeto de tradução
const pt = {
  sign_in: {
    email_label: "Email",
    password_label: "Senha",
    email_input_placeholder: "Digite seu email",
    password_input_placeholder: "Digite sua senha",
    button_label: "Entrar",
    loading_button_label: "Entrando...",
    social_provider_text: "Entrar com {{provider}}",
    link_text: "Já tem uma conta? Entre",
  },
  forgotten_password: {
    email_label: "Email",
    password_label: "Email",
    email_input_placeholder: "Digite seu email",
    button_label: "Enviar instruções de reset",
    loading_button_label: "Enviando instruções...",
    link_text: "Esqueceu sua senha?",
    confirmation_text: "Verifique seu email para o link de reset de senha",
  },
};

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (event === "SIGNED_IN") {
          router.push('/dashboard'); // Ajuste para sua rota de dashboard
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
        <div className="flex items-center gap-2 mb-8 text-white">
          <Link href="/" className="flex items-center gap-2 text-sm hover:underline">
            <ArrowLeft className="w-4 h-4" />
            Voltar para início
          </Link>
        </div>

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
            // CORREÇÃO PRINCIPAL: URLs específicas para cada tipo
            redirectTo={`${getURL()}/auth/callback`}
            // NOVO: Configuração específica para reset de senha
            additionalData={{
              forgotPasswordRedirectTo: `${getURL()}/auth/reset-password`
            }}
            view="sign_in"
            localization={{ variables: pt }}
            showLinks={true}
          />

          <div className="mt-6 flex flex-col items-center text-sm text-gray-300 space-y-2">
            <Link href="/sign-up" className="hover:underline text-emerald-400">
              Criar conta grátis
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}