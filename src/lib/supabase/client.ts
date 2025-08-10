// src/lib/supabase/client.ts
import { supabase } from '@/lib/supabase'

// Função para criar/exportar o cliente - compatibilidade com seu código atual
export const createClient = () => supabase

// Export direto para facilitar importação
export { supabase as default }

// Export nomeado para compatibilidade
export { supabase }