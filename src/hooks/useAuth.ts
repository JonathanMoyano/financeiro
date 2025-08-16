import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

interface UseAuthReturn {
  user: User | null;
  loading: boolean;
  error: string | null;
  signOut: () => Promise<void>;
  checkSession: () => Promise<void>;
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const router = useRouter();
  const supabase = createClientComponentClient();

  const checkSession = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }
      
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
      }
    } catch (err: any) {
      console.error('Erro ao verificar sessão:', err);
      setError(err.message || 'Erro ao verificar autenticação');
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();

    // Escutar mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event);
      
      if (session?.user) {
        setUser(session.user);
        setError(null);
      } else {
        setUser(null);
      }
      
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setUser(null);
      router.push('/login');
    } catch (err: any) {
      console.error('Erro ao fazer logout:', err);
      setError(err.message || 'Erro ao fazer logout');
    } finally {
      setLoading(false);
    }
  };

  return {
    user,
    loading,
    error,
    signOut,
    checkSession,
  };
}