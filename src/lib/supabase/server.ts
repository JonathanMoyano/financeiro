import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/lib/database.types'

export function createClient() {
  const cookieStore = cookies()

  // Cria uma instância do cliente Supabase para uso em Server Components, Route Handlers e Server Actions.
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // O método `set` foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver um middleware atualizando as sessões.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // O método `delete` foi chamado de um Server Component.
            // Isso pode ser ignorado se você tiver um middleware atualizando as sessões.
          }
        },
      },
    }
  )
}