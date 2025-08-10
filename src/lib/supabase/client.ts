import { createBrowserClient } from '@supabase/ssr'

// Variável para armazenar a instância única do cliente
let client: ReturnType<typeof createBrowserClient> | undefined = undefined

/**
 * Cria e retorna uma instância única (singleton) do cliente Supabase para o navegador.
 * Isso evita a criação de múltiplas instâncias, que pode causar erros de cookie
 * e comportamento inesperado, especialmente com Fast Refresh em desenvolvimento.
 */
export function createClient() {
  // Se a instância ainda não foi criada, cria-a
  if (client === undefined) {
    client = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }

  // Retorna a instância existente
  return client
}
