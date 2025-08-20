import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Tipo básico para Database - ajuste conforme seu arquivo de tipos
type Database = any;

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refreshing auth tokens
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Rotas protegidas que precisam de autenticação
  const protectedRoutes = [
    "/dashboard",
    "/despesas",
    "/poupanca",
    "/relatorios",
    "/configuracoes",
  ];

  // Rotas de autenticação
  const authRoutes = ["/login", "/sign-up", "/update-password"];

  // Rotas públicas que não precisam de autenticação
  const publicRoutes = [
    "/", // Landing page
    "/privacy",
    "/terms",
    "/contact",
    "/about",
  ];

  // Verificar se é uma rota protegida
  const isProtectedRoute =
    protectedRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/(platform)");

  // Verificar se é uma rota de autenticação
  const isAuthRoute =
    authRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/(auth)");

  // Verificar se é uma rota pública
  const isPublicRoute = publicRoutes.some((route) => pathname === route);

  // Rotas de callback e reset que não precisam de verificação
  const isCallbackRoute =
    pathname.startsWith("/auth/callback") ||
    pathname.startsWith("/auth/forgot-password") ||
    pathname.startsWith("/auth/reset-password");

  console.log(
    `🔄 Middleware: [${request.method}] ${pathname} | User: ${
      user ? "Yes" : "No"
    } | Protected: ${isProtectedRoute} | Auth: ${isAuthRoute} | Public: ${isPublicRoute}`
  );

  // Permitir acesso às rotas de callback sem verificação
  if (isCallbackRoute) {
    console.log("🔄 Callback route - allowing access");
    return supabaseResponse;
  }

  // Permitir acesso às rotas públicas sem verificação
  if (isPublicRoute) {
    console.log("🌐 Public route - allowing access");
    return supabaseResponse;
  }

  // Redirecionar usuários não autenticados de rotas protegidas para login
  if (isProtectedRoute && !user) {
    console.log("🔒 Access denied to protected route. Redirecting to /login.");
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirecionar usuários autenticados de rotas de auth para dashboard
  if (isAuthRoute && user) {
    console.log("🔄 User already logged in. Redirecting to /dashboard.");
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // Permitir acesso a todas as outras rotas
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/ (API routes)
     * - .*\\.(?:svg|png|jpg|jpeg|gif|webp)$ (image files)
     */
    "/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
