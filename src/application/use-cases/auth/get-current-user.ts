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
        const meta = user.user_metadata || {};
        const fallbackAvatar = meta.avatar_url || meta.picture || null;
        const fallbackName = meta.full_name || meta.name || user.email?.split('@')[0] || 'Người dùng';
        const effectiveAvatar = profile?.avatar_url || fallbackAvatar;

        if (profile) {
          // If avatar was missing in DB profile but exists in OAuth metadata, asynchronously persist it
          if (!profile.avatar_url && fallbackAvatar) {
            void supabase
              .from('profiles')
              .update({ avatar_url: fallbackAvatar })
              .eq('id', user.id);
          }

          return {
            user: {
              id: profile.id,
              email: profile.email,
              fullName: profile.full_name || fallbackName,
              avatarUrl: effectiveAvatar,
              phone: profile.phone,
              isSystemAdmin: profile.is_system_admin ?? false,
              createdAt: new Date(profile.created_at),
              updatedAt: new Date(profile.updated_at),
            },
            organizationName: 'EventGo Agency',
          };
        } else {
          return {
            user: {
              id: user.id,
              email: user.email || '',
              fullName: fallbackName,
              avatarUrl: fallbackAvatar,
              phone: user.phone || null,
              isSystemAdmin: false,
              createdAt: new Date(user.created_at),
              updatedAt: new Date(),
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
      isSystemAdmin: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    organizationName: 'EventGo Demo Agency (Hà Nội)',
  };
}
