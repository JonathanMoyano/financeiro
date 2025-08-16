'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, Mail, Lock, LogIn, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const router = useRouter()

  // Verificar se já está logado ao carregar a página
  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        console.log('✅ Usuário já está logado, redirecionando...')
        window.location.href = '/dashboard'
      }
    }
    checkAuth()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      if (isLogin) {
        // Login
        console.log('🔐 Tentando fazer login com:', email)
        
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password
        })

        if (error) {
          console.error('❌ Erro no login:', error)
          throw error
        }

        if (data.user) {
          console.log('✅ Login realizado com sucesso:', data.user.id)
          setSuccess('Login realizado com sucesso! Redirecionando...')
          
          // Aguardar um pouco para garantir que a sessão foi salva
          console.log('🔄 Aguardando sessão ser salva...')
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Verificar se a sessão foi salva
          const { data: { session: newSession } } = await supabase.auth.getSession()
          console.log('🔍 Verificando sessão após login:', newSession ? 'EXISTE' : 'NÃO EXISTE')
          
          if (newSession) {
            console.log('✅ Sessão confirmada, redirecionando...')
            window.location.href = '/dashboard'
          } else {
            console.log('❌ Sessão não encontrada, tentando novamente...')
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 1000)
          }
        }
      } else {
        // Cadastro
        if (password !== confirmPassword) {
          throw new Error('As senhas não coincidem')
        }

        if (password.length < 6) {
          throw new Error('A senha deve ter pelo menos 6 caracteres')
        }

        console.log('📝 Tentando criar conta para:', email)

        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password: password,
          options: {
            data: {
              full_name: email.split('@')[0] // Usar parte do email como nome
            }
          }
        })

        if (error) {
          console.error('❌ Erro no cadastro:', error)
          throw error
        }

        if (data.user) {
          console.log('✅ Conta criada com sucesso:', data.user.id)
          
          if (data.user.email_confirmed_at) {
            // Email já confirmado, fazer login automático
            setSuccess('Conta criada com sucesso! Redirecionando...')
            console.log('🔄 Redirecionando para dashboard...')
            setTimeout(() => {
              window.location.href = '/dashboard'
            }, 500)
          } else {
            // Precisa confirmar email
            setSuccess('Conta criada! Verifique seu email para confirmar.')
            setIsLogin(true) // Voltar para tela de login
          }
        }
      }
    } catch (error: any) {
      console.error('❌ Erro:', error)
      
      // Tratar erros específicos
      let errorMessage = error.message || 'Erro desconhecido'
      
      if (errorMessage.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos'
      } else if (errorMessage.includes('Email not confirmed')) {
        errorMessage = 'Email não confirmado. Verifique sua caixa de entrada.'
      } else if (errorMessage.includes('User already registered')) {
        errorMessage = 'Este email já está cadastrado. Tente fazer login.'
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      console.log('🔗 Tentando login com Google')
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/dashboard`
        }
      })

      if (error) {
        console.error('❌ Erro no login com Google:', error)
        throw error
      }
    } catch (error: any) {
      console.error('❌ Erro:', error)
      setError('Erro ao fazer login com Google')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl shadow-lg border p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <LogIn className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {isLogin ? 'Bem-vindo de volta' : 'Criar nova conta'}
            </h1>
            <p className="text-muted-foreground">
              {isLogin 
                ? 'Entre na sua conta para continuar' 
                : 'Crie sua conta para começar'
              }
            </p>
          </div>

          {/* Alertas */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          {/* Formulário */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            {/* Senha */}
            <div>
              <label className="block text-sm font-medium mb-1">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-10 pr-10 py-2 border border-input rounded-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isLogin ? 'Sua senha' : 'Mínimo 6 caracteres'}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirmar Senha (apenas no cadastro) */}
            {!isLogin && (
              <div>
                <label className="block text-sm font-medium mb-1">
                  Confirmar Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    required
                    className="w-full pl-10 pr-3 py-2 border border-input rounded-md text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirme sua senha"
                  />
                </div>
              </div>
            )}

            {/* Botão Principal */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-primary-foreground rounded-md py-2 text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                  Processando...
                </>
              ) : (
                <>
                  {isLogin ? <LogIn className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                  {isLogin ? 'Entrar' : 'Criar Conta'}
                </>
              )}
            </button>
          </form>

          {/* Divisor */}
          <div className="my-6 flex items-center">
            <div className="flex-1 border-t border-border"></div>
            <span className="px-3 text-xs text-muted-foreground">OU</span>
            <div className="flex-1 border-t border-border"></div>
          </div>

          {/* Login com Google */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white text-gray-700 border border-gray-300 rounded-md py-2 text-sm font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar com Google
          </button>

          {/* Toggle Login/Cadastro */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              {isLogin ? 'Não tem uma conta?' : 'Já tem uma conta?'}
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin)
                  setError(null)
                  setSuccess(null)
                  setPassword('')
                  setConfirmPassword('')
                }}
                className="ml-2 text-primary hover:text-primary/80 font-medium"
              >
                {isLogin ? 'Criar conta' : 'Fazer login'}
              </button>
            </p>
            
            {/* Botão de teste para debug */}
            {success && (
              <div className="mt-4 space-y-2">
                <button
                  onClick={async () => {
                    console.log('🔍 Verificando sessão manualmente...')
                    const { data: { session } } = await supabase.auth.getSession()
                    console.log('📊 Sessão atual:', session)
                    if (session) {
                      console.log('✅ Sessão encontrada, forçando redirecionamento...')
                      // Aguardar um pouco para garantir que os cookies sejam definidos
                      await new Promise(resolve => setTimeout(resolve, 1000))
                      window.location.href = '/dashboard'
                    } else {
                      console.log('❌ Nenhuma sessão encontrada')
                      alert('Sessão não encontrada. Tente fazer login novamente.')
                    }
                  }}
                  className="w-full text-sm bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  🔍 Verificar Sessão e Ir para Dashboard
                </button>
                
                <button
                  onClick={() => {
                    console.log('🔄 Forçando redirecionamento direto...')
                    window.location.href = '/dashboard'
                  }}
                  className="w-full text-sm bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                >
                  🚀 Ir Direto para Dashboard (Testar Middleware)
                </button>
                
                <button
                  onClick={async () => {
                    console.log('🍪 Verificando cookies...')
                    if (typeof window !== 'undefined') {
                      const cookies = document.cookie.split(';')
                      console.log('📝 Todos os cookies:', cookies)
                      const authCookies = cookies.filter(c => 
                        c.includes('supabase') || c.includes('auth') || c.includes('sb-')
                      )
                      console.log('🔐 Cookies de auth:', authCookies)
                      
                      if (authCookies.length === 0) {
                        alert('❌ Nenhum cookie de autenticação encontrado!')
                      } else {
                        alert(`✅ ${authCookies.length} cookies de auth encontrados. Veja o console.`)
                      }
                    }
                  }}
                  className="w-full text-sm bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700"
                >
                  🍪 Debug Cookies
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-xs text-muted-foreground">
            Ao continuar, você concorda com nossos termos de uso e política de privacidade.
          </p>
        </div>
      </div>
    </div>
  )
}