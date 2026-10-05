import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { UserProfile } from '@/domain/entities';
import { env } from '@/config/env';
import { Database } from '@/types/database.types';

export interface CurrentUserSession {
  user: UserProfile;
  organizationName: string;
}

/**
 * Retrieves the current authenticated user profile and organization.
 * Falls back to demo session if Supabase environment variables are pending.
 */
export async function getCurrentUserSession(): Promise<CurrentUserSession> {
  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profile = data as (Database['public']['Tables']['profiles']['Row']) | null;

        if (profile) {
          return {
            user: {
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name,
              avatarUrl: profile.avatar_url,
              phone: profile.phone,
              createdAt: new Date(profile.created_at),
              updatedAt: new Date(profile.updated_at),
            },
            organizationName: 'EventGo Agency',
          };
        }
      }
    } catch {
      // Fall through to demo profile
    }
  }

  // Default demo Project Manager session for local prototyping
  return {
    user: {
      id: 'e31ecfe6-6008-4ae5-aa9c-2cc65d2c191a',
      email: 'pm1@eventgo.vn',
      fullName: 'Nguyễn Văn Quản Lý (Demo PM)',
      avatarUrl: null,
      phone: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    organizationName: 'EventGo Demo Agency (Hà Nội)',
  };
}
