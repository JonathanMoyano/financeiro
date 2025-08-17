import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

export function AuthGuard({ 
  children, 
  fallback, 
  redirectTo = '/login' 
}: AuthGuardProps) {
  const { user, loading, error, checkSession, clearAuthError } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && !error) {
      router.push(redirectTo);
    }
  }, [user, loading, error, router, redirectTo]);

  // Loading state
  if (loading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="max-w-md w-full bg-card border rounded-lg p-6 text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Erro na Autenticação
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              {error}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <button 
              onClick={() => {
                clearAuthError();
                checkSession();
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar Novamente
            </button>
            <button 
              onClick={() => {
                clearAuthError();
                // Limpar dados corrompidos e recarregar
                if (typeof window !== 'undefined') {
                  const cookies = ['sb-access-token', 'sb-refresh-token', 'supabase-auth-token'];
                  cookies.forEach(cookie => {
                    document.cookie = `${cookie}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
                  });
                  localStorage.clear();
                  sessionStorage.clear();
                  window.location.href = '/login';
                }
              }}
              className="px-4 py-2 border border-input rounded-md hover:bg-accent transition-colors text-sm"
            >
              Limpar Dados e Fazer Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return null; // Vai redirecionar via useEffect
  }

  // Authenticated - render children
  return <>{children}</>;
}