'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Obter a URL base do ambiente
      const baseUrl = window.location.origin;
      const redirectTo = `${baseUrl}/auth/update-password`;
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: redirectTo,
      });
      
      if (error) {
        throw error;
      }
      
      setSuccess(true);
      
    } catch (err: any) {
      console.error('Erro ao enviar email:', err);
      setError(err.message || 'Erro ao enviar email de recuperação. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
        <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">Email Enviado!</h2>
            <p className="text-gray-400 mb-6">
              Enviamos um link de recuperação para <span className="text-white font-semibold">{email}</span>
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Por favor, verifique sua caixa de entrada e siga as instruções no email para redefinir sua senha.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push('/login')}
                className="w-full bg-gray-700 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-all duration-200"
              >
                Voltar ao Login
              </button>
              <button
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                className="w-full text-gray-400 hover:text-white transition-colors text-sm"
              >
                Não recebeu o email? Tente novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Esqueceu sua senha?
          </h1>
          <p className="text-gray-400 text-sm">
            Não se preocupe! Digite seu email e enviaremos instruções para redefinir sua senha.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm text-center">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="seu@email.com"
              required
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Enviando...
              </>
            ) : (
              'Enviar Link de Recuperação'
            )}
          </button>
        </form>

        <div className="mt-6 flex items-center justify-center">
          <button
            onClick={() => router.push('/login')}
            className="flex items-center text-sm text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} className="mr-1" />
            Voltar para o login
          </button>
        </div>
      </div>
    </div>
  );
}