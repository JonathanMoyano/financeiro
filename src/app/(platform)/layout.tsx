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
  ChevronRight,
  ChevronLeft,
  Clock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  X,
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
import {
  differenceInDays,
  parseISO,
  format,
  startOfDay,
  addDays,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// TYPES
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
  description?: string;
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

interface Notification {
  id: string;
  title: string;
  message: string;
  type: "info" | "warning" | "success" | "error";
  created_at: string;
  read: boolean;
  amount?: number;
  dueDate?: string;
  category?: string;
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
    description: "Metas e planejamento",
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart2,
    description: "Análises financeiras",
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
  collapsed = false,
}: {
  item: NavItem;
  isActive: boolean;
  onClick?: () => void;
  collapsed?: boolean;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={cn(
      "group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
      "hover:bg-accent/80 hover:text-accent-foreground",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1",
      isActive
        ? "bg-primary text-primary-foreground shadow-sm font-semibold"
        : "text-muted-foreground hover:text-foreground",
      collapsed && "justify-center px-2"
    )}
    title={collapsed ? item.label : undefined}
  >
    <item.icon
      className={cn(
        "h-5 w-5 shrink-0 transition-colors",
        isActive ? "text-primary-foreground" : "text-current"
      )}
    />

    {!collapsed && (
      <div className="flex-1 min-w-0">
        <span className="truncate">{item.label}</span>
        <span className="text-xs opacity-70 truncate block mt-0.5 md:hidden">
          {item.description}
        </span>
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
      className={cn("space-y-1", collapsed ? "px-2" : "px-3", className)}
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
      <div className="space-y-2">
        <div className="h-3 w-20 bg-muted/60 rounded" />
        <div className="h-2 w-16 bg-muted/60 rounded" />
      </div>
    )}
  </div>
);

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();
  const supabase = createClient();

  // Função para buscar notificações reais do banco
  const fetchNotifications = useCallback(async () => {
    if (!isOpen || !user) return;

    setIsLoading(true);
    try {
      const today = startOfDay(new Date());
      const next30Days = addDays(today, 30);

      // Buscar despesas recorrentes ou com vencimento próximo
      const { data: despesasData } = await supabase
        .from("despesas")
        .select("*")
        .eq("user_id", user.id)
        .gte("data", today.toISOString().split("T")[0])
        .lte("data", next30Days.toISOString().split("T")[0])
        .order("data", { ascending: true })
        .limit(20);

      // Buscar metas de poupança próximas do vencimento
      const { data: poupancaData } = await supabase
        .from("poupanca")
        .select("*")
        .eq("user_id", user.id)
        .not("data_objetivo", "is", null)
        .gte("data_objetivo", today.toISOString().split("T")[0])
        .lte("data_objetivo", next30Days.toISOString().split("T")[0])
        .order("data_objetivo", { ascending: true })
        .limit(10);

      const processedNotifications: Notification[] = [];

      // Processar despesas como notificações
      despesasData?.forEach((despesa, index) => {
        const dueDate = parseISO(despesa.data);
        const daysUntilDue = differenceInDays(dueDate, today);

        let type: Notification["type"] = "info";
        let title = "";

        if (daysUntilDue < 0) {
          type = "error";
          title = "Despesa em atraso";
        } else if (daysUntilDue === 0) {
          type = "warning";
          title = "Vence hoje";
        } else if (daysUntilDue <= 3) {
          type = "warning";
          title = "Vence em breve";
        } else {
          type = "info";
          title = "Próxima despesa";
        }

        processedNotifications.push({
          id: `despesa-${despesa.id}-${index}`,
          title,
          message: despesa.descricao || "Despesa sem descrição",
          type,
          created_at: despesa.created_at || new Date().toISOString(),
          read: false,
          amount: Number(despesa.valor) || 0,
          dueDate: despesa.data,
          category: despesa.categoria || "Sem categoria",
        });
      });

      // Processar metas de poupança
      poupancaData?.forEach((meta, index) => {
        const targetDate = parseISO(meta.data_objetivo);
        const daysUntilTarget = differenceInDays(targetDate, today);
        const valorAtual = Number(meta.valor_atual) || 0;
        const valorObjetivo = Number(meta.valor_objetivo) || 0;
        const progresso =
          valorObjetivo > 0 ? (valorAtual / valorObjetivo) * 100 : 0;

        let type: Notification["type"] = "info";
        let title = "";

        if (progresso >= 100) {
          type = "success";
          title = "Meta atingida!";
        } else if (daysUntilTarget <= 7 && progresso < 80) {
          type = "warning";
          title = "Meta em risco";
        } else if (daysUntilTarget <= 30) {
          type = "info";
          title = "Meta próxima";
        }

        if (title) {
          processedNotifications.push({
            id: `meta-${meta.id}-${index}`,
            title,
            message: meta.descricao || "Meta de poupança",
            type,
            created_at: meta.created_at || new Date().toISOString(),
            read: false,
            amount: valorObjetivo,
            dueDate: meta.data_objetivo,
            category: "Poupança",
          });
        }
      });

      // Adicionar notificações do sistema se houver dados suficientes
      if (processedNotifications.length === 0) {
        const systemNotifications: Notification[] = [
          {
            id: "welcome",
            title: "Bem-vindo ao Meu Financeiro!",
            message: "Comece adicionando suas primeiras transações.",
            type: "info",
            created_at: new Date().toISOString(),
            read: false,
          },
          {
            id: "tip-1",
            title: "Dica financeira",
            message: "Defina metas de poupança para alcançar seus objetivos.",
            type: "info",
            created_at: new Date(Date.now() - 3600000).toISOString(),
            read: false,
          },
        ];
        processedNotifications.push(...systemNotifications);
      }

      // Ordenar por urgência e data
      const sortedNotifications = processedNotifications.sort((a, b) => {
        const urgencyOrder = { error: 0, warning: 1, success: 2, info: 3 };
        const urgencyDiff = urgencyOrder[a.type] - urgencyOrder[b.type];
        if (urgencyDiff !== 0) return urgencyDiff;

        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });

      setNotifications(sortedNotifications.slice(0, 10));
    } catch (error) {
      console.error("Erro ao carregar notificações:", error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  }, [isOpen, user, supabase]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const getDueDateInfo = (dateString?: string) => {
    if (!dateString) return null;

    const date = parseISO(dateString);
    const today = startOfDay(new Date());
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

  const urgentNotifications = notifications.filter(
    (n) => n.type === "error" || n.type === "warning"
  );

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "warning":
        return <Clock className="h-4 w-4 text-orange-600" />;
      case "success":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      default:
        return <Bell className="h-4 w-4 text-blue-600" />;
    }
  };

  const getNotificationBgColor = (type: Notification["type"]) => {
    switch (type) {
      case "error":
        return "bg-red-100 dark:bg-red-900/30";
      case "warning":
        return "bg-orange-100 dark:bg-orange-900/30";
      case "success":
        return "bg-green-100 dark:bg-green-900/30";
      default:
        return "bg-blue-100 dark:bg-blue-900/30";
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            "h-9 w-9 md:h-10 md:w-10 rounded-lg transition-all duration-200 relative",
            "hover:bg-accent/80 active:scale-95",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          )}
          aria-label={`Notificações ${
            urgentNotifications.length > 0
              ? `(${urgentNotifications.length} urgentes)`
              : ""
          }`}
        >
          <Bell className="h-4 w-4 md:h-5 md:w-5" />
          {urgentNotifications.length > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 md:h-3 md:w-3 bg-red-500 rounded-full border border-background animate-pulse">
              <span className="sr-only">
                {urgentNotifications.length} notificações urgentes
              </span>
            </div>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-72 md:w-80 p-0 shadow-lg border-2 mx-2 md:mx-0"
        sideOffset={8}
      >
        <div className="p-3 md:p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">Notificações</h3>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => fetchNotifications()}
            >
              Atualizar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {isLoading
              ? "Carregando..."
              : `${notifications.length} ${
                  notifications.length === 1 ? "notificação" : "notificações"
                }`}
          </p>
        </div>

        <div className="max-h-64 md:max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            <div className="p-1 md:p-2 space-y-1">
              {notifications.map((notif) => {
                const dueDateInfo = notif.dueDate
                  ? getDueDateInfo(notif.dueDate)
                  : null;
                return (
                  <div
                    key={notif.id}
                    className="flex items-start gap-2 md:gap-3 p-2 md:p-3 rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 md:h-8 md:w-8 items-center justify-center rounded-full shrink-0",
                        getNotificationBgColor(notif.type)
                      )}
                    >
                      {getNotificationIcon(notif.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        {dueDateInfo && (
                          <p
                            className={cn(
                              "text-xs font-medium",
                              dueDateInfo.color
                            )}
                          >
                            {dueDateInfo.text}
                          </p>
                        )}
                        {notif.amount && (
                          <p className="text-xs font-semibold text-foreground">
                            {formatCurrency(notif.amount)}
                          </p>
                        )}
                      </div>
                      {notif.dueDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(parseISO(notif.dueDate), "dd 'de' MMM", {
                            locale: ptBR,
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center p-6 md:p-8">
              <CheckCircle2 className="h-10 w-10 md:h-12 md:w-12 text-green-500 mx-auto mb-3" />
              <p className="text-sm font-medium">Tudo em dia!</p>
              <p className="text-xs text-muted-foreground">
                Nenhuma notificação pendente.
              </p>
            </div>
          )}
        </div>

        {notifications.length > 0 && (
          <div className="p-2 border-t bg-muted/20">
            <Button
              variant="ghost"
              size="sm"
              className="w-full text-xs"
              asChild
            >
              <Link href="/dashboard" onClick={() => setIsOpen(false)}>
                Ver dashboard completo
                <ChevronRight className="h-3 w-3 ml-2" />
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

  const handleMenuClick = (path: string) => {
    setIsOpen(false);
    // Pequeno delay para permitir o fechamento do menu
    setTimeout(() => {
      router.push(path);
    }, 100);
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "relative h-9 w-auto justify-start px-2 gap-2 md:h-10 md:px-3 md:gap-3",
            "hover:bg-accent/80 data-[state=open]:bg-accent/80",
            "transition-all duration-200",
            "border border-transparent hover:border-border/50",
            "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          )}
          aria-label="Menu do usuário"
        >
          <div className="flex items-center gap-2 md:gap-3">
            <div className="relative">
              <div className="flex items-center justify-center h-8 w-8 md:h-9 md:w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-xs md:text-sm font-bold ring-1 ring-background shadow-sm">
                {userInitials}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-emerald-500 border border-background rounded-full" />
            </div>

            <div className="hidden sm:block min-w-0 flex-1">
              <p className="text-sm font-semibold leading-none truncate max-w-[100px] md:max-w-[140px]">
                {fullName}
              </p>
              <p className="text-xs text-muted-foreground leading-none mt-1 truncate max-w-[100px] md:max-w-[140px]">
                {user?.email}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "h-3 w-3 md:h-4 md:w-4 opacity-50 hidden sm:block transition-transform duration-200",
                isOpen && "rotate-180"
              )}
            />
          </div>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-64 md:w-72 p-2 shadow-lg border-2 mx-2 md:mx-0"
        sideOffset={8}
        side="bottom"
        avoidCollisions
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <DropdownMenuLabel className="p-2 md:p-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-white text-sm md:text-base font-bold shadow-lg">
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
          className="rounded-lg cursor-pointer p-2 md:p-3 focus:bg-accent focus:text-accent-foreground"
          onClick={() => handleMenuClick("/configuracoes/perfil")}
        >
          <User className="h-4 w-4 mr-3" />
          <div>
            <span className="font-medium">Perfil</span>
            <p className="text-xs text-muted-foreground">
              Informações pessoais
            </p>
          </div>
        </DropdownMenuItem>

        <DropdownMenuItem
          className="rounded-lg cursor-pointer p-2 md:p-3 focus:bg-accent focus:text-accent-foreground"
          onClick={() => handleMenuClick("/configuracoes/aparencia")}
        >
          <Settings className="h-4 w-4 mr-3" />
          <div>
            <span className="font-medium">Configurações</span>
            <p className="text-xs text-muted-foreground">Tema e preferências</p>
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
            "rounded-lg cursor-pointer p-2 md:p-3",
            "text-red-600 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50",
            "dark:hover:bg-red-950/20 dark:focus:bg-red-950/20"
          )}
        >
          <LogOut className="mr-3 h-4 w-4" />
          <div>
            <span className="font-medium">Sair da conta</span>
            <p className="text-xs opacity-70">Fazer logout</p>
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
      "flex items-center gap-2 md:gap-3 font-semibold transition-all duration-200",
      "hover:opacity-90",
      "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg p-1",
      collapsed && "justify-center"
    )}
    title={collapsed ? APP_CONFIG.name : undefined}
  >
    <div className="relative">
      <APP_CONFIG.logo className="h-6 w-6 md:h-8 md:w-8 text-primary group-hover:text-primary/80 transition-colors" />
    </div>
    {!collapsed && (
      <div className="hidden md:block">
        <span className="font-bold text-lg md:text-xl tracking-tight">
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
      "flex items-center gap-2 px-2 py-1.5 md:px-3 md:py-2 rounded-lg bg-primary/10 border border-primary/20",
      collapsed && "justify-center px-1"
    )}
  >
    <div className="h-1.5 w-1.5 md:h-2 md:w-2 rounded-full bg-primary animate-pulse" />
    {!collapsed && (
      <span className="text-xs font-medium text-primary">Online</span>
    )}
  </div>
);

const DesktopSidebar = () => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "hidden border-r bg-background/80 backdrop-blur-xl lg:block relative overflow-hidden transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="relative flex h-full max-h-screen flex-col">
        <div
          className={cn(
            "flex h-14 items-center border-b bg-background/80 backdrop-blur-sm transition-all duration-300",
            collapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <AppLogo collapsed={collapsed} />
          {!collapsed && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setCollapsed(true)}
              className="h-7 w-7 rounded-lg hover:bg-accent/50"
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
              className="h-7 w-7 rounded-lg hover:bg-accent/50"
              title="Expandir sidebar"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto py-4">
          <MainNavigation collapsed={collapsed} />
        </div>

        <div
          className={cn(
            "border-t bg-background/80 backdrop-blur-sm p-3 transition-all duration-300",
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
            "shrink-0 lg:hidden h-9 w-9",
            "hover:bg-accent/80 transition-all duration-200",
            "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1"
          )}
          aria-label="Abrir menu de navegação"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="flex flex-col p-0 w-72 border-r-2"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetTitle className="sr-only">
          Menu de Navegação - Meu Financeiro
        </SheetTitle>

        <SheetHeader className="flex flex-row items-center justify-between h-14 px-4 border-b">
          <AppLogo />
        </SheetHeader>

        <SheetDescription className="sr-only">
          Menu de navegação principal com acesso às funcionalidades do sistema
        </SheetDescription>

        <div className="flex-1 overflow-y-auto py-4">
          <MainNavigation onNavigate={handleClose} />
        </div>

        <div className="border-t p-4">
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
          <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-2 md:gap-4 border-b bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 px-3 md:px-4 lg:px-6 shadow-sm">
            <MobileSidebar />

            <div className="flex-1" />

            <div className="flex items-center gap-1 md:gap-2">
              <NotificationBell />
              <UserMenu {...userMenuProps} />
            </div>
          </header>

          <main className="flex-1 overflow-auto">
            <div className="min-h-full relative">
              <div className="relative">
                <div className="mx-auto max-w-7xl px-3 py-4 md:px-4 md:py-6 lg:px-6 lg:py-8">
                  <div className="space-y-4 md:space-y-6">{children}</div>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
