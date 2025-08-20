import Link from "next/link";
import { ArrowLeft, PiggyBank, Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="relative z-50 flex items-center justify-between p-4 px-6 md:px-10 backdrop-blur-md bg-white/10 border-b border-white/20">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative">
            <PiggyBank className="w-8 h-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
            <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur group-hover:bg-emerald-300/30 transition-all"></div>
          </div>
          <h1 className="text-xl md:text-2xl font-bold text-white">
            Meu Financeiro
          </h1>
        </Link>

        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6 py-12">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">
              Política de Privacidade
            </h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 space-y-6">
              <p className="text-lg">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  1. Informações que Coletamos
                </h2>
                <p>
                  Coletamos apenas as informações necessárias para fornecer
                  nossos serviços de gestão financeira:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Informações de conta (email, nome)</li>
                  <li>Dados financeiros que você escolhe inserir</li>
                  <li>Informações de uso da plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  2. Como Usamos suas Informações
                </h2>
                <p>Suas informações são utilizadas exclusivamente para:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Fornecer funcionalidades de gestão financeira</li>
                  <li>Melhorar nossos serviços</li>
                  <li>Comunicações relacionadas ao serviço</li>
                  <li>Garantir a segurança da plataforma</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  3. Proteção de Dados
                </h2>
                <p>Implementamos medidas robustas de segurança:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Criptografia de dados em trânsito e em repouso</li>
                  <li>Autenticação segura</li>
                  <li>Acesso restrito aos dados</li>
                  <li>Monitoramento contínuo de segurança</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  4. Compartilhamento de Dados
                </h2>
                <p>
                  Não vendemos, alugamos ou compartilhamos seus dados pessoais
                  com terceiros, exceto quando necessário para operação do
                  serviço ou exigido por lei.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  5. Seus Direitos
                </h2>
                <p>Você tem direito a:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Acessar seus dados pessoais</li>
                  <li>Corrigir informações incorretas</li>
                  <li>Excluir sua conta e dados</li>
                  <li>Exportar seus dados</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Contato
                </h2>
                <p>
                  Para questões sobre privacidade, entre em contato conosco em:
                  <br />
                  <strong className="text-emerald-400">
                    contato@jonathanmoyano.com.br
                  </strong>
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
