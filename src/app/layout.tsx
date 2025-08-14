// Em: src/app/layout.tsx

import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Analytics } from "@vercel/analytics/react"; // Corrigido para /react, que é mais universal

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1b3a" },
  ],
};

export const metadata: Metadata = {
  title: {
    default: "Meu Financeiro",
    template: "%s | Meu Financeiro",
  },
  description: "Controle suas finanças pessoais com facilidade e inteligência.",
  keywords: [
    "finanças",
    "controle financeiro",
    "orçamento",
    "despesas",
    "receitas",
  ],
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="pt-BR"
      suppressHydrationWarning
      className={`${inter.variable} antialiased`}
    >
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
              <div className="flex-1">{children}</div>
            </div>
          </TooltipProvider>
        </ThemeProvider>

        {/* O Vercel Analytics foi adicionado aqui */}
        <Analytics />

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
