// Em: capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meufinanceiro.app',
  appName: 'Meu Financeiro',
  webDir: 'out', // Esta linha será ignorada, mas não há problema em mantê-la.

  // CONFIRA SE ESTA SEÇÃO ESTÁ PRESENTE E CORRETA:
  server: {
    url: 'https://financeiro-amber.vercel.app', // USE A SUA URL REAL DA VERCEL AQUI
    cleartext: true
  }
};

export default config;