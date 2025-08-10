"use client";

import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { PiggyBank, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Funções e clientes importados corretamente
import { createClient } from "@/lib/supabase/client";
import { getURL } from "@/lib/utils";

// Objeto de tradução (mantido como está)
const pt = { /* ... seu objeto de tradução ... */ };

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  // useEffect simplificado para escutar apenas por novas autenticações
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        // Quando o usuário faz login com sucesso nesta página...
        if (event === "SIGNED_IN") {
          // ...redireciona para o dashboard da plataforma.
          router.push('/platform/dashboard');
        }
      }
    );

    // Limpa a inscrição quando o componente é desmontado
    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 px-4">
      {/* O resto do seu JSX permanece exatamente o mesmo, pois está excelente. */}
      {/* ... seu código JSX para o layout da página ... */}
        
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