// src/app/(platform)/configuracoes/layout.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { User, Palette, Settings, ChevronRight, Home } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const sidebarNavItems = [
  {
    title: "Perfil",
    href: "/configuracoes/perfil",
    description: "Gerencie suas informações pessoais e configurações de conta",
    icon: User,
    badge: null,
  },
  {
    title: "Aparência", 
    href: "/configuracoes/aparencia",
    description: "Personalize a aparência e tema da aplicação",
    icon: Palette,
    badge: "Novo",
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  
  // Encontra o item ativo
  const activeItem = sidebarNavItems.find(item => pathname === item.href);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
        <div className="max-w-7xl mx-auto">
          
          {/* Breadcrumb melhorado */}
          <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-6">
            <Link 
              href="/dashboard" 
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <Home className="h-4 w-4" />
              <span>Início</span>
            </Link>
            <ChevronRight className="h-4 w-4" />
            <div className="flex items-center gap-1">
              <Settings className="h-4 w-4" />
              <span>Configurações</span>
            </div>
            {activeItem && (
              <>
                <ChevronRight className="h-4 w-4" />
                <div className="flex items-center gap-2">
                  <activeItem.icon className="h-4 w-4" />
                  <span className="text-foreground font-medium">{activeItem.title}</span>
                  {activeItem.badge && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                      {activeItem.badge}
                    </Badge>
                  )}
                </div>
              </>
            )}
          </nav>

          {/* Page Header melhorado */}
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-8">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Configurações
              </h1>
              <p className="text-muted-foreground text-lg max-w-2xl">
                Personalize sua experiência e gerencie as preferências da sua conta de forma simples e intuitiva.
              </p>
            </div>
            
            {/* Status/Info adicional */}
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Sistema online
              </Badge>
            </div>
          </div>

          {/* Main Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Sidebar melhorado */}
            <aside className="lg:col-span-4 xl:col-span-3">
              <div className="sticky top-8">
                <div className="bg-card/50 backdrop-blur-sm border rounded-xl shadow-sm p-4 space-y-4">
                  <div className="px-2">
                    <h2 className="text-sm font-semibold tracking-tight uppercase text-muted-foreground mb-3 flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Navegação
                    </h2>
                  </div>
                  
                  <nav className="space-y-2">
                    {sidebarNavItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "group flex items-start gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02]",
                            isActive 
                              ? "bg-primary text-primary-foreground shadow-md ring-2 ring-primary/20" 
                              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                          )}
                        >
                          <Icon className={cn(
                            "h-5 w-5 transition-colors flex-shrink-0 mt-0.5",
                            isActive 
                              ? "text-primary-foreground" 
                              : "text-muted-foreground group-hover:text-accent-foreground"
                          )} />
                          
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              "font-semibold flex items-center gap-2",
                              isActive ? "text-primary-foreground" : ""
                            )}>
                              {item.title}
                              {item.badge && (
                                <Badge 
                                  variant={isActive ? "secondary" : "outline"} 
                                  className="text-xs px-1.5 py-0.5"
                                >
                                  {item.badge}
                                </Badge>
                              )}
                            </div>
                            <div className={cn(
                              "text-xs leading-relaxed mt-1",
                              isActive 
                                ? "text-primary-foreground/80" 
                                : "text-muted-foreground"
                            )}>
                              {item.description}
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </nav>

                  {/* Footer da sidebar */}
                  <div className="pt-4 mt-6 border-t border-border/60">
                    <p className="text-xs text-muted-foreground px-2">
                      Suas configurações são salvas automaticamente e sincronizadas em todos os seus dispositivos.
                    </p>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <main className="lg:col-span-8 xl:col-span-9">
              <div className="space-y-6">
                {/* Content Header com contexto visual */}
                {activeItem && (
                  <div className="bg-gradient-to-r from-card/80 to-card/40 backdrop-blur-sm border rounded-xl p-6 shadow-sm">
                    <div className="flex items-start gap-4">
                      <div className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl shadow-sm",
                        activeItem.title === "Perfil" && "bg-blue-100 dark:bg-blue-900/20",
                        activeItem.title === "Aparência" && "bg-purple-100 dark:bg-purple-900/20"
                      )}>
                        <activeItem.icon className={cn(
                          "h-6 w-6",
                          activeItem.title === "Perfil" && "text-blue-600 dark:text-blue-400",
                          activeItem.title === "Aparência" && "text-purple-600 dark:text-purple-400"
                        )} />
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-3">
                          <h2 className="text-2xl font-bold tracking-tight">
                            {activeItem.title}
                          </h2>
                          {activeItem.badge && (
                            <Badge variant="secondary" className="text-xs">
                              {activeItem.badge}
                            </Badge>
                          )}
                        </div>
                        <p className="text-muted-foreground leading-relaxed">
                          {activeItem.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content Body */}
                <div className="bg-card/50 backdrop-blur-sm border rounded-xl shadow-sm">
                  <div className="p-6 md:p-8">
                    {children}
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}