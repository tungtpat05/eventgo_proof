import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { Database } from '@/types/database.types';
import { env } from '@/config/env';

/**
 * Creates a Supabase client for Server Components and Server Actions.
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies();

  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error('Supabase environment variables are required.');
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // The `setAll` method was called from a Server Component.
          // Server Components cannot write cookies; proxy.ts refreshes the session.
        }
      },
    },
  });
}

/**
 * Creates an administrative Supabase client using the Service Role Key.
 * MUST ONLY be called within backend Server Actions or use-cases
 * after strict authorization checks (e.g., requireCampaignManager).
 */
export function createAdminSupabaseClient() {
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error('Supabase Service Role Key is required for admin operations.');
  }

  return createClient<Database>(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
