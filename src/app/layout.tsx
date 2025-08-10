// Em: src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

// CORRETO: Next.js gerencia o viewport a partir daqui.
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5, // Permite zoom para acessibilidade
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1b3a" },
  ],
};

// CORRETO: Next.js gerencia todos os metadados a partir daqui.
export const metadata: Metadata = {
  title: {
    default: "Meu Financeiro",
    template: "%s | Meu Financeiro"
  },
  description: "Controle suas finanças pessoais com facilidade e inteligência.",
  keywords: ["finanças", "controle financeiro", "orçamento", "despesas", "receitas"],
  authors: [{ name: "Meu Financeiro Team" }],
  robots: { index: true, follow: true },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Meu Financeiro",
  },
  formatDetection: { telephone: false },
  // ... outros metadados que você queira adicionar
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // A tag <html> é o container principal
    <html lang="pt-BR" suppressHydrationWarning className={`${inter.variable} antialiased`}>
      {/* REMOVIDO: A tag <head> manual foi removida. 
        Next.js vai injetar o <head> aqui automaticamente.
      */}
      <body className={`${inter.className} min-h-screen font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange={false}
          storageKey="meu-financeiro-theme"
        >
          <TooltipProvider delayDuration={200}>
            <div className="relative flex min-h-screen flex-col bg-background">
              <div className="flex-1">
                {children}
              </div>
            </div>
          </TooltipProvider>
        </ThemeProvider>
        
        {/* O script para o tema pode permanecer, pois manipula o DOM diretamente */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const theme = localStorage.getItem('meu-financeiro-theme') || 'system';
                  const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = theme === 'dark' || (theme === 'system' && systemPrefersDark);
                  document.documentElement.classList.toggle('dark', isDark);
                } catch (e) {}
              })();
            `,
          }}
        />
      </body>
    </html>
  );
}