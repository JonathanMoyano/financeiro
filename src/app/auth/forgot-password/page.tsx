"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Mail, ArrowLeft, CheckCircle, Loader2, KeyRound } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      console.log("🔑 Enviando email de recuperação para:", email);

      // URL de redirecionamento correta para o reset
      const redirectTo = `${window.location.origin}/auth/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: redirectTo,
        }
      );

      if (error) {
        console.error("❌ Erro ao enviar email:", error);
        throw error;
      }

      console.log("✅ Email de recuperação enviado com sucesso");
      setSuccess(true);
    } catch (err: any) {
      console.error("❌ Erro:", err);

      let errorMessage = err.message || "Erro ao enviar email de recuperação";

      if (errorMessage.includes("Unable to validate email address")) {
        errorMessage = "Email inválido. Verifique o formato.";
      } else if (errorMessage.includes("Email not found")) {
        errorMessage = "Este email não está cadastrado em nossa plataforma.";
      } else if (errorMessage.includes("For security purposes")) {
        errorMessage =
          "Por segurança, aguarde alguns minutos antes de tentar novamente.";
      } else if (errorMessage.includes("rate limit")) {
        errorMessage =
          "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border p-8">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>

              <h1 className="text-2xl font-bold text-foreground mb-2">
                Email Enviado!
              </h1>

              <p className="text-muted-foreground mb-4">
                Enviamos um link de recuperação para:
              </p>

              <p className="text-foreground font-semibold mb-6 break-all">
                {email}
              </p>

              <div className="bg-muted/50 rounded-lg p-4 mb-6">
                <p className="text-sm text-muted-foreground">
                  Verifique sua caixa de entrada e siga as instruções no email
                  para redefinir sua senha. O link expira em 1 hora.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => router.push("/login")}
                  className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Voltar ao Login
                </button>

                <button
                  onClick={() => {
                    setSuccess(false);
                    setEmail("");
                    setError(null);
                  }}
                  className="w-full text-muted-foreground hover:text-foreground transition-colors text-sm py-2"
                >
                  Não recebeu o email? Tentar novamente
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-xs text-muted-foreground">
              Problemas com o email?{" "}
              <Link href="/contact" className="text-primary hover:underline">
                Entre em contato
              </Link>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Formulário principal
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Esqueceu sua senha?
            </h1>
            <p className="text-muted-foreground">
              Digite seu email para receber o link de recuperação
            </p>
          </div>

          {/* Botão voltar */}
          <Link
            href="/login"
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar ao login
          </Link>

          {/* Alert de erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Enviaremos um link para este email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando link...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Enviar Link de Recuperação
                </>
              )}
            </button>
          </form>

          {/* Informações adicionais */}
          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Não recebeu o email?
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• Verifique a pasta de spam/lixo eletrônico</li>
              <li>• Confirme se o email está correto</li>
              <li>• Aguarde alguns minutos e tente novamente</li>
            </ul>
          </div>

          {/* Link alternativo */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Lembrou da senha?{" "}
              <Link
                href="/login"
                className="text-primary hover:text-primary/80 font-medium"
              >
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Não tem uma conta?{" "}
            <Link href="/sign-up" className="text-primary hover:underline">
              Criar conta gratuita
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
