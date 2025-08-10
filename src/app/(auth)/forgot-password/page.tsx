"use client";

import Link from "next/link";
import { PiggyBank, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useState } from "react";

export default function ForgotPasswordManual() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // CORREÇÃO: Usar resetPasswordForEmail com configuração mais específica
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://financeiro-amber.vercel.app/auth/reset-password',
      });

      if (error) {
        console.error('Erro no resetPasswordForEmail:', error);
        setError(error.message);
      } else {
        setMessage("Verifique o seu e-mail para o link de redefinição de senha");
      }
    } catch (err) {
      console.error('Erro inesperado:', err);
      setError("Erro inesperado. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

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

        {/* Card de redefinição de senha */}
        <div className="backdrop-blur-lg bg-white/10 border border-white/20 rounded-2xl shadow-2xl p-6 md:p-8">
          <div className="mb-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-3">
              <PiggyBank className="w-10 h-10 text-emerald-400" />
              <h1 className="text-3xl font-bold text-white">Meu Financeiro</h1>
            </div>
            <p className="text-gray-300">
              Redefina sua senha
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                Endereço de e-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="O seu endereço de e-mail"
                required
                className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-1 focus:ring-emerald-400"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              {loading ? "A enviar..." : "Enviar instruções"}
            </button>

            {message && (
              <div className="p-4 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                <p className="text-emerald-300 text-sm">{message}</p>
              </div>
            )}

            {error && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}