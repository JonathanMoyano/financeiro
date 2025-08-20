"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  BarChart3,
  PiggyBank,
  TrendingUp,
  Target,
  Zap,
  Loader2,
  Shield,
  Smartphone,
  DollarSign,
  Calendar,
  Eye,
  EyeOff,
  FileText,
  Settings,
  Wallet,
} from "lucide-react";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Se usuário está logado, redireciona para dashboard
  useEffect(() => {
    if (user && !loading) {
      router.push("/dashboard");
    }
  }, [user, loading, router]);

  // Se está verificando auth ou usuário logado, mostra loading
  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {user ? "Redirecionando para o dashboard..." : "Carregando..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header Minimalista */}
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4 lg:px-8">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-colors">
              <PiggyBank className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold text-foreground">
              Meu Financeiro
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/sign-up"
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
            >
              Começar grátis
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-foreground">Controle total das suas</span>
                <br />
                <span className="text-primary">finanças pessoais</span>
              </h1>

              <p className="text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 leading-relaxed">
                Gerencie receitas, despesas e metas de poupança em uma
                plataforma intuitiva e segura. Tome decisões financeiras
                inteligentes com relatórios detalhados e insights
                personalizados.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-medium shadow-lg hover:shadow-xl"
                >
                  <Zap className="w-5 h-5" />
                  Começar agora - é grátis
                </Link>

                <Link
                  href="/login"
                  className="flex items-center gap-2 px-8 py-3 border border-border hover:bg-accent transition-colors text-lg font-medium rounded-lg"
                >
                  Já tenho conta
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* Funcionalidades Principais */}
        <section className="py-20 border-t bg-background/50">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Tudo que você precisa para organizar suas finanças
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Funcionalidades completas e intuitivas para cada aspecto da sua
                vida financeira
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Gestão de Transações */}
              <div className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Wallet className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Gestão de Transações
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Registre receitas e despesas com categorização automática.
                  Controle completo de entradas e saídas com histórico
                  detalhado.
                </p>
              </div>

              {/* Metas de Poupança */}
              <div className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Metas de Poupança
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Defina objetivos financeiros e acompanhe seu progresso. Crie
                  múltiplas metas com prazos e valores personalizados.
                </p>
              </div>

              {/* Relatórios e Análises */}
              <div className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Relatórios Detalhados
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Visualize seus padrões financeiros com gráficos interativos.
                  Análises por período, categoria e tendências de gastos.
                </p>
              </div>

              {/* Dashboard Inteligente */}
              <div className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Dashboard Inteligente
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Visão geral completa com saldo atual, progresso de metas e
                  resumo mensal em tempo real.
                </p>
              </div>

              {/* Configurações Avançadas */}
              <div className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Settings className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Personalização Total
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Customize categorias, defina orçamentos mensais e configure
                  notificações para manter suas finanças organizadas.
                </p>
              </div>

              {/* Segurança e Privacidade */}
              <div className="group p-6 bg-card rounded-2xl border hover:shadow-lg transition-all duration-300">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Shield className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Segurança Garantida
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Seus dados protegidos com criptografia de ponta. Controle
                  total sobre visibilidade e privacidade das informações.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Recursos Especiais */}
        <section className="py-20 border-t">
          <div className="max-w-6xl mx-auto px-4 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Recursos que fazem a diferença
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Eye className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Modo Privacidade
                    </h3>
                    <p className="text-muted-foreground">
                      Oculte valores sensíveis com um clique. Perfeito para usar
                      em locais públicos.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Smartphone className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      100% Responsivo
                    </h3>
                    <p className="text-muted-foreground">
                      Acesse de qualquer dispositivo. Interface otimizada para
                      desktop, tablet e mobile.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Filtros Avançados
                    </h3>
                    <p className="text-muted-foreground">
                      Visualize dados por período, categoria ou tipo. Encontre
                      informações rapidamente.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">
                      Exportação de Dados
                    </h3>
                    <p className="text-muted-foreground">
                      Exporte relatórios e dados para análise externa. Seus
                      dados, seu controle.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/20 rounded-full mb-6">
                      <DollarSign className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-4">
                      Completamente Gratuito
                    </h3>
                    <p className="text-muted-foreground">
                      Todas as funcionalidades disponíveis sem custo. Sem
                      limitações, sem taxas ocultas, sem pegadinhas.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Final */}
        <section className="py-20 border-t bg-primary/5">
          <div className="max-w-4xl mx-auto text-center px-4 lg:px-8">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-6">
              Comece a organizar suas finanças hoje
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Junte-se a milhares de pessoas que já transformaram sua relação
              com o dinheiro. Cadastro simples, acesso imediato.
            </p>

            <Link
              href="/sign-up"
              className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-lg font-semibold shadow-lg hover:shadow-xl"
            >
              <Zap className="w-5 h-5" />
              Criar conta gratuita
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer Minimalista */}
      <footer className="border-t bg-background/50">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl">
                <PiggyBank className="w-6 h-6 text-primary" />
              </div>
              <span className="text-lg font-bold text-foreground">
                Meu Financeiro
              </span>
            </div>

            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                Privacidade
              </Link>
              <Link
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                Termos
              </Link>
              <Link
                href="/contact"
                className="hover:text-foreground transition-colors"
              >
                Contato
              </Link>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t text-center">
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} Meu Financeiro. Todos os
              direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
