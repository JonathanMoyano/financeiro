// capacitor.config.ts - VERSÃO CORRIGIDA

import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meufinanceiro.app',
  appName: 'Meu Financeiro',
  webDir: 'out', // <<< CORREÇÃO APLICADA AQUI
};

export default config;