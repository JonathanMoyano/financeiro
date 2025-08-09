"use client"

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { PiggyBank, LayoutDashboard, Wallet, BarChart, Settings } from "lucide-react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/despesas", label: "Transações", icon: Wallet },
  { href: "/relatorios", label: "Relatórios", icon: BarChart },
  { href: "/orcamentos", label: "Orçamentos", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gray-50 dark:bg-gray-900 border-r h-screen fixed">
      <div className="p-6 flex items-center gap-2 border-b">
        <PiggyBank className="w-8 h-8 text-primary" />
        <h1 className="text-2xl font-bold">Meu Financeiro</h1>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={pathname === item.href ? "secondary" : "ghost"}
            className="w-full justify-start"
          >
            <Link href={item.href}>
              <item.icon className="mr-2 h-4 w-4" />
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>
      <div className="p-4 border-t">
        {/* Aqui podemos adicionar o perfil do usuário e o botão de sair no futuro */}
      </div>
    </aside>
  );
}
