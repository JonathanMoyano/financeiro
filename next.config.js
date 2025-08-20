/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Configurações Essenciais e de Performance ---
  reactStrictMode: true,
  swcMinify: true,
  poweredByHeader: false, // Melhora a segurança
  compress: true, // Habilita compressão Gzip

  // --- Configurações do Servidor ---
  // A opção 'serverComponentsExternalPackages' foi movida para o nível principal.
  serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],

  // --- Otimização de Imagens ---
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30, // Cache de 30 dias
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // --- Headers de Segurança e Performance ---
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
        ],
      },
    ];
  },

  // --- Configuração do Compilador ---
  compiler: {
    // Remove `console.log` em produção
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // --- Configuração do ESLint ---
  eslint: {
    // Garante que o ESLint é executado durante o build para apanhar erros.
    ignoreDuringBuilds: false,
  },

  // --- Otimizações do Webpack ---
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              chunks: "all",
            },
          },
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
