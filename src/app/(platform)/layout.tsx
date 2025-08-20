"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Wallet,
  BarChart2,
  LogOut,
  Menu,
  User,
  PiggyBank,
  Settings,
  ChevronDown,
  Bell,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  Home,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useEffect, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import { differenceInDays, parseISO, format } from "date-fns";
import { ptBR } from "date-fns/locale";

// TYPES
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
  shortcut?: string;
}

interface UserMenuProps {
  user: any | null;
  isLoading: boolean;
  onLogout: () => Promise<void>;
}

interface NavigationProps {
  onNavigate?: () => void;
  className?: string;
  collapsed?: boolean;
}

interface BreadcrumbItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

// CONSTANTS
const NAV_ITEMS: NavItem[] = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    description: "Visão geral das suas finanças",
  },
  {
    href: "/despesas",
    label: "Transações",
    icon: Wallet,
    description: "Gerenciar receitas e despesas",
  },
  {
    href: "/poupanca",
    label: "Poupança",
    icon: PiggyBank,
    description: "Metas de poupança, reservas e planejamento",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart2,
    description: "Análises e insights financeiros",
  },
] as const;

const APP_CONFIG = {
  name: "Meu Financeiro",
  shortName: "MF",
  logo: PiggyBank,
  version: "2.0.0",
  description: "Controle inteligente das suas finanças",
} as const;

// UTILITIES
const getUserInitials = (email?: string, fullName?: string): string => {
  if (fullName) {
    const names = fullName.trim().split(" ").filter(Boolean);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0]?.slice(0, 2).toUpperCase() || "U";
  }
  if (!email) return "U";
  const [name] = email.split("@");
  return name.slice(0, 2).toUpperCase();
};

const getDisplayName = (email?: string, fullName?: string): string => {
  if (fullName) {
    const firstName = fullName.split(" ")[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }
  if (!email) return "Usuário";
  const [name] = email.split("@");
  return name.charAt(0).toUpperCase() + name.slice(1);
};

const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(amount);
};

// CUSTOM HOOKS
const useAuth = () => {
  const router = useRouter();
  const supabase = createClient();
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error("Error fetching user:", error);
          if (mounted) {
            setUser(null);
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setUser(data.user);
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error fetching user:", error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (event === "SIGNED_OUT") {
          router.push("/login");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  const handleLogout = useCallback(async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error signing out:", error);
      }
      router.push("/");
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  return { user, isLoading, handleLogout };
};

// COMPONENTS
const NavItemComponent = ({
  item,
  isActive,
  onClick,
  showDescription = false,
  collapsed = false,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  showDescription?: boolean;
  collapsed?: boolean;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={cn(
      "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
      "hover:bg-accent/80 hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-r before:from-transparent before:via-white/5 before:to-transparent before:opacity-0 before:transition-opacity before:duration-300",
      isActive
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold before:opacity-100"
        : "text-muted-foreground hover:text-foreground",
      collapsed && "justify-center px-2"
    )}
    title={collapsed ? `${item.label} (${item.shortcut})` : undefined}
  >
    <item.icon
      className={cn(
        "h-5 w-5 shrink-0 transition-all duration-200",
        "group-hover:scale-110",
        isActive ? "text-primary-foreground drop-shadow-sm" : "text-current"
      )}
    />

    {!collapsed && (
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="truncate">{item.label}</span>
          {item.shortcut && (
            <span className="text-xs opacity-60 ml-2">{item.shortcut}</span>
          )}
        </div>
        {showDescription && item.description && (
          <span className="text-xs opacity-70 truncate block mt-0.5">
            {item.description}
          </span>
        )}
      </div>
    )}

    {item.badge && (
      <span
        className={cn(
          "flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs text-destructive-foreground font-bold",
          collapsed && "absolute -top-1 -right-1 h-4 w-4"
        )}
      >
        {item.badge}
      </span>
    )}

    {isActive && (
      <div className="absolute inset-y-0 left-0 w-1 bg-primary-foreground rounded-r-full" />
    )}
  </Link>
);

const MainNavigation = ({
  onNavigate,
  className,
  collapsed = false,
}: NavigationProps) => {
  const pathname = usePathname();

  return (
    <nav
      className={cn("space-y-1", collapsed ? "px-2" : "px-4", className)}
      role="navigation"
      aria-label="Navegação principal"
    >
      {NAV_ITEMS.map((item) => {
        const isActive =
          pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={isActive}
            onClick={onNavigate}
            showDescription={!collapsed}
            collapsed={collapsed}
          />
        );
      })}
    </nav>
  );
};

const LoadingSkeleton = ({ collapsed = false }: { collapsed?: boolean }) => (
  <div
    className={cn(
      "flex items-center gap-3 animate-pulse",
      collapsed && "justify-center"
    )}
  >
    <div className="h-10 w-10 rounded-full bg-muted/60" />
    {!collapsed && (
      <div className="hidden sm:block space-y-2">
        <div className="h-3 w-24 bg-muted/60 rounded-full" />
        <div className="h-2 w-20 bg-muted/60 rounded-full" />
      </div>
    )}
  </div>
);

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!isOpen) return;

      setIsLoading(true);
      try {
        // Dados mockados para teste - substitua pela função real quando disponível
        // const upcomingBills = await getUpcomingBills();
        const upcomingBills: any[] = []; // Mock data
        setNotifications(upcomingBills || []);
      } catch (error) {
        console.error("Falha ao carregar notificações:", error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNotifications();
  }, [isOpen]);

  const getDueDateInfo = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = differenceInDays(date, today);

    if (days < 0)
      return {
        text: "Vencido",
        color: "text-red-600",
        bgColor: "bg-red-100 dark:bg-red-900/30",
      };
    if (days === 0)
      return {
        text: "Vence hoje",
        color: "text-orange-600",
        bgColor: "bg-orange-100 dark:bg-orange-900/30",
      };
    if (days === 1)
      return {
        text: "Vence amanhã",
        color: "text-yellow-600",
        bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
      };
    return {
      text: `Vence em ${days} dias`,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    };
  };

  const urgentNotifications = notifications.filter((n) => {
    const days = differenceInDays(parseISO(n.date), new Date());
    return days <= 1;
  });

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-xl transition-all duration-200 relative",
            "hover:bg-accent/80 hover:scale-105 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label={`Notificações ${
            notifications.length > 0 ? `(${notifications.length})` : ""
          }`}
        >
          <Bell className="h-5 w-5" />
          {urgentNotifications.length > 0 && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse">
              <span className="sr-only">
                {urgentNotifications.length} notificações urgentes
              </span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 shadow-lg border-2">
        <div className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Contas a Vencer</h3>
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
              Ver todas
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading
              ? "Carregando..."
              : `${notifications.length} ${
                  notifications.length === 1 ? "conta" : "contas"
                } nos próximos 30 dias`}
          </p>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="p-2 space-y-1">
              {notifications.map((notif) => {
                const dueDateInfo = getDueDateInfo(notif.date);
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-3 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        dueDateInfo.bgColor
                      )}
                    >
                      <AlertTriangle
                        className={cn("h-4 w-4", dueDateInfo.color)}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notif.description}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p
                          className={cn(
                            "text-xs font-medium",
                            dueDateInfo.color
                          )}
                        >
                          {dueDateInfo.text}
                        </p>
                        <p className="text-sm font-semibold text-red-600">
                          {formatCurrency(notif.amount)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(parseISO(notif.date), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-8">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">
                Nenhuma conta vencendo.
              </p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/20">
            <Button variant="ghost" size="sm" className="w-full" asChild>
              <Link href="/despesas" onClick={() => setIsOpen(false)}>
                Ver todas as transações
                <ChevronRight className="h-4 w-4 ml-2" />
              </Link>
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

const UserMenu = ({ user, isLoading, onLogout }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  const userInitials = getUserInitials(
    user?.email,
    user?.user_metadata?.full_name
  );
  const displayName = getDisplayName(
    user?.email,
    user?.user_metadata?.full_name
  );
  const fullName = user?.user_metadata?.full_name || displayName;

  const handleProfileClick = () => {
    setIsOpen(false);
    router.push("/configuracoes/perfil");
  };

  const handleAppearanceClick = () => {
    setIsOpen(false);
    router.push("/configuracoes/aparencia");
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-12 w-auto justify-start px-3 gap-3",
            "hover:bg-accent/80 data-[state=open]:bg-accent/80",
            "transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]",
            "border border-transparent hover:border-border/50",
            "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="Menu do usuário"
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm font-bold ring-2 ring-background shadow-lg">
                {userInitials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-emerald-500 border-2 border-background rounded-full" />
            </div>

            <div className="hidden text-left sm:block min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none truncate max-w-[140px]">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground leading-none mt-1 truncate max-w-[140px]">
                {user?.email}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 opacity-50 hidden sm:block transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-72 p-2 shadow-lg border-2"
        sideOffset={8}
        side="bottom"
        avoidCollisions
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-base font-bold shadow-lg">
              {userInitials}
            </div>
            <div className="flex flex-col space-y-1 min-w-0 flex-1">
              <p className="text-sm font-semibold leading-tight truncate">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  Online
                </span>
              </div>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          className="rounded-lg cursor-pointer p-3 focus:bg-accent focus:text-accent-foreground"
          onClick={handleProfileClick}
        >
          <User className="h-4 w-4 mr-3" />
          <div>
            <span className="font-medium">Perfil</span>
            <p className="text-xs text-muted-foreground">
              Gerenciar informações pessoais
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="rounded-lg cursor-pointer p-3 focus:bg-accent focus:text-accent-foreground"
          onClick={handleAppearanceClick}
        >
          <Settings className="h-4 w-4 mr-3" />
          <div>
            <span className="font-medium">Configurações</span>
            <p className="text-xs text-muted-foreground">
              Tema e personalização
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuSeparator className="my-2" />

        <DropdownMenuItem
          onClick={(e) => {
            e.preventDefault();
            setIsOpen(false);
            onLogout();
          }}
          className={cn(
            "rounded-lg cursor-pointer p-3",
            "text-red-600 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50",
            "dark:hover:bg-red-950/20 dark:focus:bg-red-950/20"
          )}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <div>
            <span className="font-medium">Sair da conta</span>
            <p className="text-xs opacity-70">Fazer logout do sistema</p>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AppLogo = ({ collapsed = false }: { collapsed?: boolean }) => (
  <Link
    href="/dashboard"
    className={cn(
      "flex items-center gap-3 font-semibold transition-all duration-200",
      "hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]",
      "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1",
      collapsed && "justify-center"
    )}
    title={collapsed ? APP_CONFIG.name : undefined}
  >
    <div className="relative">
      <APP_CONFIG.logo className="h-8 w-8 text-primary group-hover:text-primary/80 transition-colors drop-shadow-sm" />
    </div>
    {!collapsed && (
      <div>
        <span className="font-bold text-xl tracking-tight">
          {APP_CONFIG.name}
        </span>
        <div className="text-xs text-muted-foreground font-normal">
          {APP_CONFIG.description}
        </div>
      </div>
    )}
  </Link>
);

const OnlineStatus = ({ collapsed = false }: { collapsed?: boolean }) => (
  <div
    className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 dark:bg-primary/20 border border-primary/20 dark:border-primary/30",
      collapsed && "justify-center px-2"
    )}
  >
    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
    {!collapsed && (
      <span className="text-xs font-medium text-primary">Sistema Online</span>
    )}
  </div>
);

const DesktopSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden border-r bg-background/80 backdrop-blur-xl md:block relative overflow-hidden transition-all duration-300",
        collapsed ? "w-20" : "w-72"
      )}
    >
      <div className="relative flex h-full max-h-screen flex-col">
        <div
          className={cn(
            "flex h-16 items-center border-b bg-background/80 backdrop-blur-sm transition-all duration-300",
            collapsed ? "justify-center px-4" : "justify-between px-6"
          )}
        >
          <AppLogo collapsed={collapsed} />
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="h-8 w-8 rounded-lg hover:bg-accent/50"
              title="Recolher sidebar"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
        </div>

        {collapsed && (
          <div className="flex justify-center p-2 border-b">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(false)}
              className="h-8 w-8 rounded-lg hover:bg-accent/50"
              title="Expandir sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-6">
          <MainNavigation collapsed={collapsed} />
        </div>

        <div
          className={cn(
            "border-t bg-background/80 backdrop-blur-sm p-4 transition-all duration-300",
            collapsed && "p-2"
          )}
        >
          <OnlineStatus collapsed={collapsed} />
        </div>
      </div>
    </aside>
  );
};

const MobileSidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "shrink-0 md:hidden h-10 w-10",
            "hover:bg-accent/80 transition-all duration-200",
            "hover:scale-105 active:scale-95",
            "rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          )}
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex flex-col p-0 w-80 border-r-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex flex-row items-center justify-between h-16 px-6 border-b">
          <SheetTitle asChild>
            <AppLogo />
          </SheetTitle>
        </SheetHeader>

        <SheetDescription className="sr-only">
          Menu de navegação principal com acesso às funcionalidades do sistema
        </SheetDescription>

        <div className="flex-1 overflow-y-auto py-6">
          <MainNavigation onNavigate={handleClose} />
        </div>

        <div className="border-t p-4 backdrop-blur-sm">
          <OnlineStatus />
          <div className="mt-3 text-center">
            <p className="text-xs text-muted-foreground">
              {APP_CONFIG.name} v{APP_CONFIG.version}
            </p>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, handleLogout } = useAuth();

  const userMenuProps = useMemo(
    () => ({
      user,
      isLoading,
      onLogout: handleLogout,
    }),
    [user, isLoading, handleLogout]
  );

  return (
    <div className="min-h-screen w-full bg-background antialiased">
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />

        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 px-4 lg:px-6 shadow-sm">
            <MobileSidebar />

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu {...userMenuProps} />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="min-h-full relative">
              <div className="relative">
                <div className="mx-auto max-w-7xl px-4 py-6 lg:px-6 lg:py-8">
                  <div className="space-y-6">{children}</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
