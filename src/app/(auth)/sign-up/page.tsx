// src/app/(auth)/sign-up/page.tsx
"use client";


import { Auth } from "@supabase/auth-ui-react";
import { ThemeSupa } from "@supabase/auth-ui-shared";
import Link from "next/link";
import { PiggyBank } from "lucide-react";
import { createClient } from '@/lib/supabase/client';

export default function SignUpPage() {
  const supabase = createClient();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2">
            <PiggyBank className="w-10 h-10 text-primary" />
            <h1 className="text-3xl font-bold">Meu Financeiro</h1>
          </Link>
          <p className="text-muted-foreground mt-2">Crie sua conta para organizar suas finanças</p>
        </div>

        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="dark"
          providers={[]}
          redirectTo={`${location.origin}/auth/callback`}
          view="sign_up" // A visão inicial é de cadastro
        />
      </div>
    </div>
  );
}