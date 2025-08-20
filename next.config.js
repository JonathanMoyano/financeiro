/** @type {import('next').NextConfig} */
const nextConfig = {
  // --- Configurações Essenciais e de Performance ---
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,

  // --- CONFIGURAÇÃO CONDICIONAL PARA MOBILE/WEB ---
  output: process.env.BUILD_MODE === "mobile" ? "export" : undefined,
  trailingSlash: true, // Importante para o Capacitor

  // --- Server Actions (só para builds web) ---
  experimental: {
    // Server Actions são desabilitadas automaticamente com output: 'export'
    serverActions: process.env.BUILD_MODE !== "mobile",
    // Para resolver problemas com Supabase e Edge Runtime
    serverComponentsExternalPackages: [
      "@supabase/supabase-js",
      "@supabase/ssr",
    ],
  },

  // --- Otimização de Imagens ---
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 60 * 60 * 24 * 30,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Desabilita otimização para mobile build
    unoptimized: process.env.BUILD_MODE === "mobile",
  },

  // --- REMOVIDO: serverExternalPackages não é reconhecido no Next.js 14.2.3 ---
  // Esta opção foi adicionada em versões mais recentes
  // serverExternalPackages: ["@supabase/supabase-js", "@supabase/ssr"],

  // --- Headers de Segurança e Performance (só para builds web) ---
  async headers() {
    // Headers não funcionam com output: 'export', então só aplicamos para builds web
    if (process.env.BUILD_MODE === "mobile") {
      return [];
    }

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-DNS-Prefetch-Control", value: "on" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-XSS-Protection", value: "1; mode=block" },
          { key: "Referrer-Policy", value: "origin-when-cross-origin" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' blob: data: https:",
              "font-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "block-all-mixed-content",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },

  // --- Configuração do Compilador ---
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // --- Configurações Experimentais (se necessário) ---
  // Movido para cima junto com a configuração output

  // --- Otimizações do Webpack ---
  webpack: (config, { dev, isServer }) => {
    // Otimizações para produção
    if (!dev && !isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: "all",
          cacheGroups: {
            default: {
              minChunks: 2,
              priority: -20,
              reuseExistingChunk: true,
            },
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: "vendors",
              priority: -10,
              chunks: "all",
            },
            supabase: {
              test: /[\\/]node_modules[\\/]@supabase[\\/]/,
              name: "supabase",
              priority: 10,
              chunks: "all",
            },
            react: {
              test: /[\\/]node_modules[\\/](react|react-dom)[\\/]/,
              name: "react",
              priority: 20,
              chunks: "all",
            },
          },
        },
      };
    }

    // Configurações para resolver módulos do Supabase
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignorar warnings específicos do Supabase
    config.ignoreWarnings = [
      /Critical dependency: the request of a dependency is an expression/,
      /Module not found: Error: Can't resolve 'encoding'/,
    ];

    return config;
  },

  // --- Configurações de Transpilação ---
  transpilePackages: [
    "@supabase/supabase-js",
    "@supabase/realtime-js",
    "@supabase/postgrest-js",
    "@supabase/storage-js",
    "@supabase/auth-ui-react",
    "@supabase/ssr",
  ],

  // --- Configurações de Environment Variables ---
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

module.exports = nextConfig;
