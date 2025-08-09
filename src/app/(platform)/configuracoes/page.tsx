// src/app/(platform)/configuracoes/page.tsx
"use client";

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Settings, User, Palette, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const quickActions = [
  {
    title: "Perfil",
    description: "Gerencie suas informações pessoais",
    href: "/configuracoes/perfil",
    icon: User,
    color: "text-blue-600 dark:text-blue-400",
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  },
  {
    title: "Aparência", 
    description: "Personalize o tema da aplicação",
    href: "/configuracoes/aparencia",
    icon: Palette,
    color: "text-purple-600 dark:text-purple-400",
    bgColor: "bg-purple-100 dark:bg-purple-900/20"
  }
];

export default function SettingsPage() {
  const router = useRouter();
  const [isRedirecting, setIsRedirecting] = useState(true);
  const [countdown, setCountdown] = useState(3);
  
  useEffect(() => {
    // Countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          router.replace('/configuracoes/perfil');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleCancelRedirect = () => {
    setIsRedirecting(false);
  };

  if (!isRedirecting) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <Settings className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Configurações</h2>
            <p className="text-muted-foreground text-lg mt-2">
              Escolha uma seção para começar
            </p>
          </div>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Card key={action.href} className="group hover:shadow-md transition-all duration-200 hover:scale-105">
                <CardContent className="p-6">
                  <Link href={action.href} className="block">
                    <div className="flex items-start gap-4">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${action.bgColor}`}>
                        <Icon className={`h-6 w-6 ${action.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {action.title}
                          </h3>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all" />
                        </div>
                        <p className="text-muted-foreground mt-1">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Additional Info */}
        <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-800">
                <Settings className="h-4 w-4 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h4 className="font-medium text-blue-900 dark:text-blue-100">
                  Dica
                </h4>
                <p className="text-sm text-blue-800 dark:text-blue-200 mt-1">
                  Todas as suas configurações são salvas automaticamente e sincronizadas em tempo real.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-6">
      {/* Loading animation */}
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold">Carregando Configurações</h2>
          <p className="text-muted-foreground">
            Redirecionando para o perfil em <span className="font-mono font-semibold text-primary">{countdown}</span> segundo{countdown !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-64 bg-muted rounded-full h-2 overflow-hidden">
        <div 
          className="bg-primary h-full rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${((3 - countdown) / 3) * 100}%` }}
        />
      </div>

      {/* Cancel button */}
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={handleCancelRedirect}
          className="flex items-center gap-2"
        >
          <Settings className="h-4 w-4" />
          Cancelar e escolher
        </Button>
        <Button 
          onClick={() => router.replace('/configuracoes/perfil')}
          className="flex items-center gap-2"
        >
          <User className="h-4 w-4" />
          Ir para Perfil
        </Button>
      </div>
    </div>
  );
}