"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { 
  LayoutDashboard, 
  Wallet, 
  BarChart2, 
  LogOut, 
  Menu,
  User,
  PiggyBank,
  Shield,
  ChevronDown,
  Bell,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
} from "@/components/ui/sheet";
import { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { getUpcomingBills } from '@/app/actions/notifications';
import { differenceInDays, parseISO } from 'date-fns';

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
}

// CONSTANTS
const NAV_ITEMS: NavItem[] = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: LayoutDashboard,
    description: 'Visão geral das finanças'
  },
  { 
    href: '/despesas', 
    label: 'Transações', 
    icon: Wallet,
    description: 'Gerenciar receitas e despesas'
  },
  { 
    href: '/relatorios', 
    label: 'Relatórios', 
    icon: BarChart2,
    description: 'Análises e gráficos'
  },
] as const;

const APP_CONFIG = {
  name: 'Meu Financeiro',
  logo: PiggyBank,
  shortName: 'MF',
} as const;

// UTILITIES
const getUserInitials = (email?: string, fullName?: string): string => {
  if (fullName) {
    const names = fullName.trim().split(' ').filter(Boolean);
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase();
    }
    return names[0]?.slice(0, 2).toUpperCase() || 'U';
  }
  if (!email) return 'U';
  const [name] = email.split('@');
  return name.slice(0, 2).toUpperCase();
};

const getDisplayName = (email?: string, fullName?: string): string => {
  if (fullName) {
    const firstName = fullName.split(' ')[0];
    return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
  }
  if (!email) return 'Usuário';
  const [name] = email.split('@');
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// COMPONENTS
const NavItemComponent = ({ 
  item, 
  isActive, 
  onClick,
  showDescription = false 
}: { 
  item: NavItem; 
  isActive: boolean; 
  onClick?: () => void;
  showDescription?: boolean;
}) => (
  <Link
    href={item.href}
    onClick={onClick}
    className={cn(
      "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
      "hover:bg-accent/80 hover:text-accent-foreground hover:scale-[1.02] active:scale-[0.98]",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
      "relative overflow-hidden",
      isActive 
        ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25 font-semibold" 
        : "text-muted-foreground hover:text-foreground"
    )}
  >
    {isActive && (
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
    )}
    
    <item.icon className={cn(
      "h-5 w-5 shrink-0 transition-transform duration-200",
      "group-hover:scale-110",
      isActive ? "text-primary-foreground" : "text-current"
    )} />
    
    <div className="flex-1 min-w-0">
      <span className="truncate block">{item.label}</span>
      {showDescription && item.description && (
        <span className="text-xs opacity-70 truncate block mt-0.5">
          {item.description}
        </span>
      )}
    </div>
    
    {item.badge && (
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground font-bold">
        {item.badge}
      </span>
    )}
  </Link>
);

const MainNavigation = ({ onNavigate, className }: NavigationProps) => {
  const pathname = usePathname();
  
  return (
    <nav className={cn("space-y-1 px-4", className)} role="navigation" aria-label="Navegação principal">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
        return (
          <NavItemComponent
            key={item.href}
            item={item}
            isActive={isActive}
            onClick={onNavigate}
            showDescription={true}
          />
        );
      })}
    </nav>
  );
};

const LoadingSkeleton = () => (
  <div className="flex items-center gap-3 animate-pulse">
    <div className="h-10 w-10 rounded-full bg-muted/50" />
    <div className="hidden sm:block space-y-2">
      <div className="h-3 w-24 bg-muted/50 rounded-full" />
      <div className="h-2 w-20 bg-muted/50 rounded-full" />
    </div>
  </div>
);

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setIsLoading(true);
      try {
        const upcomingBills = await getUpcomingBills();
        setNotifications(upcomingBills);
      } catch (error) {
        console.error("Falha ao carregar notificações:", error);
        setNotifications([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (isOpen) {
        fetchNotifications();
    }
  }, [isOpen]);

  const getDueDateText = (dateString: string) => {
    const date = parseISO(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const days = differenceInDays(date, today);

    if (days < 0) return 'Vencido';
    if (days === 0) return 'Vence hoje';
    if (days === 1) return 'Vence amanhã';
    return `Vence em ${days} dias`;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl hover:bg-accent/80 transition-all duration-200 hover:scale-[1.05] relative"
          aria-label="Notificações"
        >
          <Bell className="h-5 w-5" />
          {notifications.length > 0 && !isLoading && (
            <div className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background animate-pulse" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b">
          <h3 className="text-sm font-medium">Contas a Vencer</h3>
          <p className="text-xs text-muted-foreground">
            {isLoading ? 'Carregando...' : `Você tem ${notifications.length} contas a vencer nos próximos 30 dias.`}
          </p>
        </div>
        <div className="p-2 max-h-80 overflow-y-auto">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notifications.length > 0 ? (
            notifications.map((notif) => (
              <div key={notif.id} className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
                   <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{notif.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {getDueDateText(notif.date)} -{' '}
                    <span className="font-semibold text-red-500">
                      {new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(notif.amount)}
                    </span>
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-sm text-muted-foreground p-8">
              Nenhuma conta a vencer.
            </div>
          )}
        </div>
        <div className="p-2 border-t bg-muted/50">
            <Button variant="ghost" size="sm" className="w-full" asChild>
                <Link href="/despesas">Ver todas as transações</Link>
            </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const UserMenu = ({ user, isLoading, onLogout }: UserMenuProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!user) {
    return null;
  }

  const userInitials = getUserInitials(user?.email, user?.user_metadata?.full_name);
  const displayName = getDisplayName(user?.email, user?.user_metadata?.full_name);
  const fullName = user?.user_metadata?.full_name || displayName;

  const handleProfileClick = () => {
    window.location.href = '/configuracoes/perfil';
  };

  const handleAppearanceClick = () => {
    window.location.href = '/configuracoes/aparencia';
  };

  return (
    <div className="relative">
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
            type="button"
          >
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold ring-2 ring-background shadow-lg">
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
              
              <ChevronDown className={cn(
                "h-4 w-4 opacity-50 hidden sm:block transition-transform duration-200",
                isOpen && "rotate-180"
              )} />
            </div>
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent 
          align="end" 
          className="w-72 p-2 z-50" 
          sideOffset={8}
          side="bottom"
          avoidCollisions={true}
          onCloseAutoFocus={(e) => e.preventDefault()}
        >
          <DropdownMenuLabel className="p-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-sm font-bold shadow-lg">
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
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs text-emerald-600 font-medium">Online</span>
                </div>
              </div>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="my-2" />
          
          <DropdownMenuItem 
            className="rounded-lg cursor-pointer p-2 focus:bg-accent focus:text-accent-foreground"
            onClick={handleProfileClick}
          >
            <User className="h-4 w-4 mr-3" />
            <div>
              <span className="font-medium">Perfil</span>
              <p className="text-xs text-muted-foreground">Gerenciar informações pessoais</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuItem 
            className="rounded-lg cursor-pointer p-2 focus:bg-accent focus:text-accent-foreground"
            onClick={handleAppearanceClick}
          >
            <Shield className="h-4 w-4 mr-3" />
            <div>
              <span className="font-medium">Aparência</span>
              <p className="text-xs text-muted-foreground">Tema e personalização</p>
            </div>
          </DropdownMenuItem>
          
          <DropdownMenuSeparator className="my-2" />
          
          <DropdownMenuItem 
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
            className={cn(
              "rounded-lg cursor-pointer p-2",
              "text-red-600 hover:text-red-600 hover:bg-red-50 focus:text-red-600 focus:bg-red-50",
              "dark:hover:bg-red-950/20 dark:focus:bg-red-950/20"
            )}
          >
            <LogOut className="mr-3 h-4 w-4" />
            <span className="font-medium">Sair da conta</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

const AppLogo = ({ collapsed = false }: { collapsed?: boolean }) => (
  <Link 
    href="/dashboard" 
    className={cn(
      "flex items-center gap-3 font-semibold transition-all duration-200",
      "hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]",
      "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-lg"
    )}
  >
    <div className="relative">
      {/* 3. Código do ícone e do brilho atualizado */}
      <APP_CONFIG.logo className="h-8 w-8 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
      <div className="absolute -inset-1 bg-emerald-400/20 rounded-full blur group-hover:bg-emerald-300/30 transition-all"></div>
    </div>
    {!collapsed && (
      <span className="font-bold text-xl tracking-tight">
        {APP_CONFIG.name}
      </span>
    )}
  </Link>
);

const OnlineStatus = () => (
  <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/30">
    <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
    <span className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
      Sistema Online
    </span>
  </div>
);

const DesktopSidebar = () => (
  <aside className="hidden border-r bg-card/30 backdrop-blur-xl md:block relative overflow-hidden">
    <div className="absolute inset-0 bg-gradient-to-b from-background/50 to-muted/30" />
    
    <div className="relative flex h-full max-h-screen flex-col">
      <div className="flex h-16 items-center border-b bg-background/50 backdrop-blur-sm px-6">
        <AppLogo />
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border hover:scrollbar-thumb-border/80">
        <MainNavigation />
      </div>
      
      <div className="border-t bg-background/50 backdrop-blur-sm p-4">
        <OnlineStatus />
      </div>
    </div>
  </aside>
);

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
            "hover:scale-[1.05] active:scale-[0.95]",
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
        
        <div className="flex-1 overflow-y-auto py-6 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
          <MainNavigation onNavigate={handleClose} />
        </div>
        
        <div className="border-t p-4 bg-muted/20">
          <OnlineStatus />
        </div>
      </SheetContent>
    </Sheet>
  );
};

const useAuth = () => {
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;

    const getUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (error) {
          console.error('Error fetching user:', error);
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
        console.error('Error fetching user:', error);
        if (mounted) {
          setUser(null);
          setIsLoading(false);
        }
      }
    };

    getUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (mounted) {
          setUser(session?.user ?? null);
          setIsLoading(false);
          if (event === 'SIGNED_OUT') {
            router.push('/login');
          }
        }
      }
    );

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
        console.error('Error signing out:', error);
      }
      router.push('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  }, [supabase, router]);

  return { user, isLoading, handleLogout };
};

export default function PlatformLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading, handleLogout } = useAuth();

  const userMenuProps = useMemo(() => ({
    user,
    isLoading,
    onLogout: handleLogout,
  }), [user, isLoading, handleLogout]);

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="flex h-screen overflow-hidden">
        <DesktopSidebar />
        
        <div className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            <MobileSidebar />
            
            <div className="flex-1" />
            
            <div className="flex items-center gap-2">
              <NotificationBell />
              <UserMenu {...userMenuProps} />
            </div>
          </header>
          
          <main className="flex-1 overflow-auto">
            <div className="min-h-full bg-gradient-to-br from-background via-muted/20 to-muted/40 relative">
              <div className="absolute inset-0 bg-grid-black/[0.02] dark:bg-grid-white/[0.02]" />
              
              <div className="relative p-4 lg:p-6">
                <div className="mx-auto max-w-7xl">
                  {children}
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
