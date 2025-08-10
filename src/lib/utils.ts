// Em: src/lib/utils.ts

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Função para mesclar classes do Tailwind CSS de forma inteligente,
 * evitando conflitos (ex: p-2 + p-4 = p-4).
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// --- Adicione a nova função aqui ---

/**
 * Função para obter a URL base da aplicação de forma segura,
 * priorizando variáveis de ambiente de produção.
 */
export const getURL = () => {
  let url =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.NEXT_PUBLIC_VERCEL_URL ||
    'https://financeiro-amber.vercel.app'; // URL de produção como fallback

  // Garante que a URL comece com https://
  url = url.includes('http') ? url : `https://${url}`;
  
  // Remove barras extras no final da URL para evitar erros de rota
  url = url.charAt(url.length - 1) === '/' ? url.slice(0, -1) : url;
  
  return url;
};