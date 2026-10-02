import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database.types';
import { env } from '@/config/env';

/**
 * Creates a Supabase client for use in browser client components.
 */
export function createClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

  return createBrowserClient<Database>(url, anonKey);
}
