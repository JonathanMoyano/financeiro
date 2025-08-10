// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.meufinanceiro.app',
  appName: 'Meu Financeiro',
  webDir: 'out', // Esta linha será ignorada, mas pode deixar
  // ADICIONE ESTA SEÇÃO:
  server: {
    url: 'https://financeiro-jonathanmoyano.vercel.app/', // SUBSTITUA PELA SUA URL REAL DA VERCEL
    cleartext: true
  }
};

export default config;