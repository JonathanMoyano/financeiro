"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Eye,
  EyeOff,
  Lock,
  KeyRound,
  CheckCircle,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import Link from "next/link";

// Componente que usa useSearchParams
function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isValidSession, setIsValidSession] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const router = useRouter();
  const searchParams = useSearchParams(); // Agora está dentro do Suspense
  const supabase = createClient();

  // Verificar se a sessão de reset é válida
  useEffect(() => {
    const checkResetSession = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("❌ Erro ao verificar sessão:", error);
          setError("Sessão de reset inválida ou expirada.");
          return;
        }

        if (!session) {
          setError("Link de reset inválido ou expirado. Solicite um novo.");
          return;
        }

        console.log("✅ Sessão de reset válida");
        setIsValidSession(true);
      } catch (error) {
        console.error("❌ Erro inesperado:", error);
        setError("Erro ao verificar sessão de reset.");
      } finally {
        setCheckingSession(false);
      }
    };

    checkResetSession();
  }, [supabase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (password !== confirmPassword) {
        throw new Error("As senhas não coincidem");
      }

      if (password.length < 6) {
        throw new Error("A senha deve ter pelo menos 6 caracteres");
      }

      console.log("🔑 Atualizando senha...");

      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        console.error("❌ Erro ao atualizar senha:", error);
        throw error;
      }

      console.log("✅ Senha atualizada com sucesso");
      setSuccess("Senha atualizada com sucesso! Redirecionando...");

      // Aguardar um pouco antes de redirecionar
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error: any) {
      console.error("❌ Erro:", error);

      let errorMessage = error.message || "Erro desconhecido";

      if (errorMessage.includes("Password should be at least")) {
        errorMessage = "A senha deve ter pelo menos 6 caracteres";
      } else if (errorMessage.includes("session_not_found")) {
        errorMessage = "Sessão expirada. Solicite um novo link de reset.";
      } else if (errorMessage.includes("invalid_credentials")) {
        errorMessage = "Credenciais inválidas. Tente novamente.";
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading da verificação inicial
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando link de reset...</p>
        </div>
      </div>
    );
  }

  // Se sessão inválida, mostrar erro
  if (!isValidSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-xl shadow-lg border p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>

            <h1 className="text-2xl font-bold text-foreground mb-2">
              Link Inválido
            </h1>

            <p className="text-muted-foreground mb-6">
              {error || "Este link de reset de senha é inválido ou já expirou."}
            </p>

            <div className="space-y-3">
              <Link
                href="/login"
                className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
              >
                Fazer Login
              </Link>

              <p className="text-sm text-muted-foreground">
                Esqueceu a senha?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Solicitar novo reset
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
              Nova Senha
            </h1>
            <p className="text-muted-foreground">
              Digite sua nova senha para continuar
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

          {/* Alertas */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <p className="text-green-700 text-sm">{success}</p>
              </div>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nova Senha */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  minLength={6}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Indicador de força da senha */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          password.length < 6
                            ? "bg-red-500 w-1/3"
                            : password.length < 8
                            ? "bg-yellow-500 w-2/3"
                            : "bg-green-500 w-full"
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs ${
                        password.length < 6
                          ? "text-red-600"
                          : password.length < 8
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {password.length < 6
                        ? "Fraca"
                        : password.length < 8
                        ? "Média"
                        : "Forte"}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirmar Senha */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Confirmar Nova Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirme sua nova senha"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Validação visual */}
              {confirmPassword.length > 0 && (
                <div className="mt-1 flex items-center gap-2">
                  {password === confirmPassword ? (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">
                        Senhas coincidem
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="h-3 w-3 rounded-full bg-red-500" />
                      <span className="text-xs text-red-600">
                        Senhas não coincidem
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Botão Principal */}
            <button
              type="submit"
              disabled={
                loading || password !== confirmPassword || password.length < 6
              }
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Atualizando senha...
                </>
              ) : (
                <>
                  <KeyRound className="h-4 w-4" />
                  Atualizar Senha
                </>
              )}
            </button>
          </form>

          {/* Dicas de Segurança */}
          <div className="mt-6 p-3 bg-muted/50 rounded-lg">
            <h3 className="text-sm font-medium text-foreground mb-2">
              Dicas para uma senha segura:
            </h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex items-center gap-2">
                <div
                  className={`w-1 h-1 rounded-full ${
                    password.length >= 6 ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                Pelo menos 6 caracteres
              </li>
              <li className="flex items-center gap-2">
                <div
                  className={`w-1 h-1 rounded-full ${
                    /[A-Z]/.test(password) && /[a-z]/.test(password)
                      ? "bg-green-500"
                      : "bg-gray-400"
                  }`}
                />
                Combine letras maiúsculas e minúsculas
              </li>
              <li className="flex items-center gap-2">
                <div
                  className={`w-1 h-1 rounded-full ${
                    /\d/.test(password) ? "bg-green-500" : "bg-gray-400"
                  }`}
                />
                Inclua números
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Problemas com o reset?{" "}
            <Link href="/contact" className="text-primary hover:underline">
              Entre em contato
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

// Componente principal com Suspense
export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
