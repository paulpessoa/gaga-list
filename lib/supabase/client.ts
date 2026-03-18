import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://qcejgeazpduqpnsakqvn.supabase.co';
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjZWpnZWF6cGR1cXBuc2FrcXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM4MTA1NDgsImV4cCI6MjA4OTM4NjU0OH0.OluJEqrAOs5EURWkDW6AcX1BGyHjXrXYUKDtcWzThG0';

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookieOptions: {
        sameSite: 'none',
        secure: true,
      }
    }
  );
}
