import Link from "next/link";
import { ArrowLeft, PiggyBank, FileText } from "lucide-react";

export default function TermsPage() {
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
            <FileText className="w-8 h-8 text-emerald-400" />
            <h1 className="text-3xl font-bold text-white">Termos de Uso</h1>
          </div>

          <div className="prose prose-invert max-w-none">
            <div className="text-gray-300 space-y-6">
              <p className="text-lg">
                Última atualização: {new Date().toLocaleDateString("pt-BR")}
              </p>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  1. Aceitação dos Termos
                </h2>
                <p>
                  Ao acessar e usar o Meu Financeiro, você concorda em cumprir
                  estes Termos de Uso. Se você não concorda com qualquer parte
                  destes termos, não deve usar nosso serviço.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  2. Descrição do Serviço
                </h2>
                <p>
                  O Meu Financeiro é uma plataforma de gestão financeira pessoal
                  que permite:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Controle de receitas e despesas</li>
                  <li>Criação e acompanhamento de metas financeiras</li>
                  <li>Geração de relatórios e análises</li>
                  <li>Planejamento orçamentário</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  3. Responsabilidades do Usuário
                </h2>
                <p>Você se compromete a:</p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Fornecer informações precisas e atualizadas</li>
                  <li>Manter a confidencialidade de suas credenciais</li>
                  <li>Usar o serviço de forma legal e ética</li>
                  <li>Não compartilhar sua conta com terceiros</li>
                  <li>Notificar-nos sobre qualquer uso não autorizado</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  4. Limitações de Responsabilidade
                </h2>
                <p>
                  O Meu Financeiro é fornecido "como está". Não nos
                  responsabilizamos por:
                </p>
                <ul className="list-disc list-inside ml-4 space-y-2">
                  <li>Decisões financeiras baseadas em dados da plataforma</li>
                  <li>Perda de dados devido a falhas técnicas</li>
                  <li>Interrupções temporárias do serviço</li>
                  <li>Danos indiretos ou consequenciais</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  5. Propriedade Intelectual
                </h2>
                <p>
                  Todo o conteúdo da plataforma, incluindo design, código,
                  textos e logotipos, são propriedade do Meu Financeiro e
                  protegidos por leis de propriedade intelectual.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  6. Modificações dos Termos
                </h2>
                <p>
                  Reservamo-nos o direito de modificar estes termos a qualquer
                  momento. Mudanças significativas serão comunicadas por email
                  ou através da plataforma.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  7. Encerramento da Conta
                </h2>
                <p>
                  Você pode encerrar sua conta a qualquer momento através das
                  configurações. Podemos suspender ou encerrar contas que violem
                  estes termos.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-semibold text-white mb-4">
                  8. Contato
                </h2>
                <p>
                  Para questões sobre os termos de uso, entre em contato
                  conosco:
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
