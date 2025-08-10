"use client";

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

/**
 * Esta página serve como um redirecionador.
 * Qualquer link para /configuracoes será imediatamente redirecionado para /configuracoes/perfil.
 * Isso simplifica a navegação, eliminando uma página intermediária.
 */
export default function SettingsRedirectPage() {
  const router = useRouter();
  
  useEffect(() => {
    // Redireciona o usuário para a página de perfil assim que o componente é montado.
    router.replace('/configuracoes/perfil');
  }, [router]);

  // Exibe um indicador de carregamento enquanto o redirecionamento ocorre.
  return (
    <div className="flex h-full flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <div className="text-center">
        <h2 className="text-xl font-semibold">Carregando configurações</h2>
        <p className="text-muted-foreground">
          Por favor, aguarde...
        </p>
      </div>
    </div>
  );
}
