import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  PiggyBank,
  TrendingUp,
  Shield,
  Smartphone,
  Star,
  Users,
  CreditCard,
  Target,
  Eye,
  Zap,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-4 px-6 md:px-10 backdrop-blur-md bg-white/10 border-b border-white/20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <PiggyBank className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur group-hover:bg-emerald-300/30 transition-all"></div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">Meu Financeiro</h1>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            Login
          </Link>
          <Link
            href="/sign-up"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-emerald-500/25 transition-all rounded-lg"
          >
            Criar Conta Grátis
            <ArrowRight className="w-4 h-4 hidden md:inline-block" />
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none'%3E%3Cg fill='%239C92AC' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          ></div>

          <div className="relative z-10 flex flex-col items-center justify-center text-center px-4 py-20 md:py-32 lg:py-40">
            <div className="max-w-5xl">
              <h2 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight mb-8">
                <span className="bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                  Assuma o controle da sua
                </span>
                <br />
                <span className="bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                  vida financeira
                </span>
              </h2>

              <p className="mt-6 text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
                A plataforma mais intuitiva para gerenciar suas finanças. Cadastre despesas,
                crie orçamentos inteligentes, visualize relatórios detalhados e tome decisões
                financeiras que transformarão sua vida.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center items-center">
                <Link
                  href="/sign-up"
                  className="flex items-center gap-2 px-8 py-6 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-lg hover:shadow-emerald-500/25 transition-all text-lg rounded-xl font-semibold"
                >
                  <Zap className="w-5 h-5" />
                  Comece agora - é grátis!
                </Link>
              </div>
            </div>
          </div>
        </section>


      </main>

      {/* Footer */}
      <footer className="relative bg-slate-900/80 backdrop-blur-sm border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-6 md:mb-0">
              <PiggyBank className="w-8 h-8 text-emerald-400" />
              <span className="text-xl font-bold text-white">Meu Financeiro</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400">
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacidade
              </Link>
              <Link href="/terms" className="hover:text-white transition-colors">
                Termos
              </Link>
              <Link href="/contact" className="hover:text-white transition-colors">
                Contato
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-white/10 text-center">
            <p className="text-gray-400">
              &copy; {new Date().getFullYear()} Meu Financeiro. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
