/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Configurações Essenciais e de Performance ---
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false, // Melhora a segurança ao não expor a tecnologia do servidor.
  compress: true, // Habilita compressão Gzip.
  output: 'standalone', // Otimizado para deployments com Docker.
  output: 'export',

  // --- Otimização de Imagens ---
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache de 30 dias para imagens.
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // --- Configurações Experimentais e do Servidor ---
  experimental: {
    // As opções 'optimizeCss' e 'optimizeServerReact' foram removidas por serem padrão em versões recentes.
    serverComponentsExternalPackages: ['@supabase/supabase-js'], // CORRETO: Mantém o Supabase externo no servidor.
  },

  // A opção 'transpilePackages' que causava conflito foi removida.
  // O bloco 'redirects' que causava erro 404 foi removido.

  // --- Headers de Segurança e Performance ---
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/favicon.ico',
        headers: [
          { key: 'Cache-Control', value: 'public, immutable, max-age=31536000' },
        ],
      },
      {
        source: '/(.*).webmanifest',
        headers: [
          { key: 'Content-Type', value: 'application/manifest+json' },
          { key: 'Cache-Control', value: 'public, max-age=31536000' },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, s-maxage=60, stale-while-revalidate=300' },
        ],
      },
    ];
  },

  // --- Configuração do Compilador ---
  compiler: {
    // Remove `console.log` em produção para um código mais limpo e performático.
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // --- Otimizações do Webpack ---
  webpack: (config, { dev, isServer }) => {
    // O alias redundante para o Supabase foi removido.
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              priority: 10,
              chunks: 'all',
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: 'supabase',
              priority: 20,
              chunks: 'all',
            },
            common: {
              name: 'common',
              minChunks: 2,
              priority: 5,
              chunks: 'all',
              enforce: true,
            },
          },
        },
      };
    }
    
    return config;
  },
};

// CORRIGIDO: O 'e' em 'exports' deve ser minúsculo.
module.exports = nextConfig;