// src/lib/supabase/client.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs' // <-- Importação correta
import type { Database } from '../database.types'

// A função agora cria um cliente para componentes 'use client'
export const createClient = () => createClientComponentClient<Database>()
