import Link from "next/link";
import {
  ArrowLeft,
  PiggyBank,
  Mail,
  MessageCircle,
  Phone,
  MapPin,
} from "lucide-react";

export default function ContactPage() {
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

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Entre em Contato
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Estamos aqui para ajudar! Entre em contato conosco através de
            qualquer um dos canais abaixo.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulário de Contato */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="w-6 h-6 text-emerald-400" />
              <h2 className="text-2xl font-semibold text-white">
                Envie uma Mensagem
              </h2>
            </div>

            <form className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Nome
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="Seu nome"
                  />
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-gray-300 mb-2"
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="subject"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Assunto
                </label>
                <select
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20"
                >
                  <option value="">Selecione um assunto</option>
                  <option value="suporte">Suporte Técnico</option>
                  <option value="feedback">Feedback/Sugestões</option>
                  <option value="bug">Relatar Bug</option>
                  <option value="parceria">Parcerias</option>
                  <option value="outro">Outro</option>
                </select>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-300 mb-2"
                >
                  Mensagem
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={6}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 resize-none"
                  placeholder="Descreva sua mensagem..."
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                Enviar Mensagem
              </button>
            </form>
          </div>

          {/* Informações de Contato */}
          <div className="space-y-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <div className="flex items-center gap-3 mb-6">
                <Mail className="w-6 h-6 text-emerald-400" />
                <h2 className="text-2xl font-semibold text-white">
                  Informações de Contato
                </h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-emerald-500/20 rounded-lg">
                    <Mail className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Email</h3>
                    <p className="text-gray-300">suporte@meufinanceiro.com</p>
                    <p className="text-sm text-gray-400">
                      Respondemos em até 24 horas
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg">
                    <Phone className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Telefone</h3>
                    <p className="text-gray-300">(11) 9999-9999</p>
                    <p className="text-sm text-gray-400">Seg-Sex: 9h às 18h</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="p-3 bg-purple-500/20 rounded-lg">
                    <MapPin className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white mb-1">Endereço</h3>
                    <p className="text-gray-300">São Paulo, SP</p>
                    <p className="text-sm text-gray-400">Brasil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* FAQ Rápida */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <h2 className="text-2xl font-semibold text-white mb-6">
                Perguntas Frequentes
              </h2>

              <div className="space-y-4">
                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    Como funciona a segurança dos dados?
                    <span className="text-emerald-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="text-gray-300 text-sm mt-2 pl-4">
                    Utilizamos criptografia de ponta e seguimos as melhores
                    práticas de segurança para proteger seus dados financeiros.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    O serviço é realmente gratuito?
                    <span className="text-emerald-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="text-gray-300 text-sm mt-2 pl-4">
                    Sim! Oferecemos um plano gratuito completo com todas as
                    funcionalidades essenciais de gestão financeira.
                  </p>
                </details>

                <details className="group">
                  <summary className="flex items-center justify-between cursor-pointer text-white font-medium py-2">
                    Como excluir minha conta?
                    <span className="text-emerald-400 group-open:rotate-180 transition-transform">
                      ▼
                    </span>
                  </summary>
                  <p className="text-gray-300 text-sm mt-2 pl-4">
                    Você pode excluir sua conta a qualquer momento através das
                    configurações da plataforma ou entrando em contato conosco.
                  </p>
                </details>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
