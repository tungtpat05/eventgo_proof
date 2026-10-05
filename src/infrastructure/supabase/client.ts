import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { env } from '@/config/env';

/**
 * Creates a Supabase client for use in browser client components.
 */
export function createClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are required.');
  }

  return createBrowserClient<Database>(url, anonKey);
}
