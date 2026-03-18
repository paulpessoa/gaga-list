// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database.types';

// ATENÇÃO: Este cliente utiliza a SERVICE_ROLE_KEY.
// Ele tem poderes de administrador e ignora as regras de RLS.
// DEVE SER USADO APENAS EM AMBIENTES DE SERVIDOR (Rotas de API, Server Actions).
// NUNCA exponha este cliente ou a chave no frontend.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-key';

if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('Supabase URL ou Service Role Key não encontrados nas variáveis de ambiente.');
}

export const supabaseServerClient = createSupabaseClient<Database>(
  supabaseUrl,
  supabaseServiceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export async function createClient() {
  const cookieStore = await cookies();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcejgeazpduqpnsakqvn.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWpnZWF6cGR1cXBuc2FrcXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTA1NDgsImV4cCI6MjA4OTM4NjU0OH0.OluJEqrAOs5EURWkDW6AcX1BGyHjXrXYUKDtcWzThG0';

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, { ...options, sameSite: 'none', secure: true })
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      cookieOptions: {
        sameSite: 'none',
        secure: true,
      }
    }
  );
}
