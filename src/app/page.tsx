// src/app/page.tsx
import { Button } from "@/components/ui/button"; // Shadcn já terá criado este componente
import Link from "next/link";
import { ArrowRight, BarChart3, CheckCircle, PiggyBank } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="flex items-center justify-between p-4 px-6 md:px-10 border-b">
        <Link href="/" className="flex items-center gap-2">
          <PiggyBank className="w-8 h-8 text-primary" />
          <h1 className="text-2xl font-bold">Meu Financeiro</h1>
        </Link>
        <div className="flex items-center gap-2 md:gap-4">
          <Button variant="ghost" asChild>
            <Link href="/login">Login</Link>
          </Button>
          <Button asChild>
            <Link href="/sign-up">
              Criar Conta Grátis
              <ArrowRight className="w-4 h-4 ml-2 hidden md:inline-block" />
            </Link>
          </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="flex flex-col items-center justify-center text-center px-4 py-20 md:py-32">
          <div className="max-w-3xl">
            <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight">
              Assuma o controle da sua vida financeira.
            </h2>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
              Cadastre despesas, crie orçamentos, visualize gráficos e tome decisões inteligentes.
            </p>
            <div className="mt-8">
              <Button size="lg" asChild>
                <Link href="/sign-up">Comece agora - é grátis!</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>
      <footer className="text-center p-6 text-muted-foreground border-t">
        <p>&copy; {new Date().getFullYear()} Meu Financeiro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}