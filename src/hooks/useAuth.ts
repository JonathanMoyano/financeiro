import { useEffect, useState, useCallback } from 'react'
import { User } from '@supabase/supabase-js'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface UseAuthReturn {
  user: User | null
  loading: boolean
  error: string | null
  signOut: () => Promise<void>
  checkSession: () => Promise<void>
  clearAuthError: () => void
}

export function useAuth(): UseAuthReturn {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const router = useRouter()
  const supabase = createClient()

  const clearAuthError = useCallback(() => {
    setError(null)
  }, [])

  const checkSession = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🔍 Verificando sessão atual...')
      
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ Erro ao verificar sessão:', error)
        setError(error.message)
        setUser(null)
        return
      }
      
      if (session?.user) {
        console.log('✅ Usuário autenticado:', session.user.id)
        setUser(session.user)
      } else {
        console.log('❌ Nenhum usuário autenticado')
        setUser(null)
      }
    } catch (err: any) {
      console.error('❌ Erro inesperado ao verificar sessão:', err)
      setError(err.message || 'Erro ao verificar autenticação')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  const signOut = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('🚪 Fazendo logout...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        throw error
      }
      
      console.log('✅ Logout realizado com sucesso')
      setUser(null)
      
      // Recarregar a página para limpar estados
      window.location.href = '/login'
    } catch (err: any) {
      console.error('❌ Erro ao fazer logout:', err)
      setError(err.message || 'Erro ao fazer logout')
    } finally {
      setLoading(false)
    }
  }, [supabase.auth])

  useEffect(() => {
    let mounted = true
    
    const initAuth = async () => {
      if (!mounted) return
      
      try {
        await checkSession()
      } catch (error) {
        console.error('❌ Erro na inicialização da autenticação:', error)
      }
    }

    initAuth()

    // Listener para mudanças na autenticação
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      
      console.log('🔄 Auth state changed:', event)
      
      try {
        if (event === 'SIGNED_OUT' || !session) {
          setUser(null)
          setError(null)
          if (event === 'SIGNED_OUT') {
            router.push('/login')
          }
        } else if (session?.user) {
          console.log('✅ Usuário logado:', session.user.id)
          setUser(session.user)
          setError(null)
        }
      } catch (error) {
        console.error('❌ Erro no listener de auth:', error)
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [checkSession, router, supabase.auth])

  return {
    user,
    loading,
    error,
    signOut,
    checkSession,
    clearAuthError,
  }
}