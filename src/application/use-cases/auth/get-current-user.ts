import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { UserProfile } from '@/domain/entities';
import { UserRole } from '@/domain/enums';
import { env } from '@/config/env';
import { Database } from '@/types/database.types';
import { cookies } from 'next/headers';

export interface CurrentUserSession {
  user: UserProfile;
  organizationName: string;
}

const DEMO_PROFILES: Record<string, { id: string; name: string; role: UserRole; phone: string }> = {
  'pm1@eventgo.vn': {
    id: 'e31ecfe6-6008-4ae5-aa9c-2cc65d2c191a',
    name: 'Nguyễn Văn Quản Lý (PM)',
    role: UserRole.PROJECT_MANAGER,
    phone: '0901234567',
  },
  'supervisor1@eventgo.vn': {
    id: '5ec73217-0087-49ec-8e34-5d3ee9402aea',
    name: 'Nguyễn Văn Giám Sát (Supervisor)',
    role: UserRole.SUPERVISOR,
    phone: '0912345678',
  },
  'approver1@eventgo.vn': {
    id: '912cabb3-731e-496a-be52-6d603d8824c9',
    name: 'Nguyễn Văn Duyệt (Approver)',
    role: UserRole.APPROVER,
    phone: '0923456789',
  },
};

/**
 * Retrieves the current authenticated user profile and organization.
 * 1. Checks Supabase Auth session if configured.
 * 2. Fetches profile from Supabase 'profiles' table.
 * 3. Falls back to demo session cookie/default for local prototyping.
 */
export async function getCurrentUserSession(): Promise<CurrentUserSession> {
  const cookieStore = await cookies();

  if (env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    try {
      const supabase = await createServerSupabaseClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // Attempt fetch by user.id
        let { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        // Fallback: If profile was seeded with matching email
        if (!profile && user.email) {
          const { data: profileByEmail } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', user.email)
            .single();
          profile = profileByEmail;
        }

        const profileRow = profile as Database['public']['Tables']['profiles']['Row'] | null;

        if (profileRow) {
          let organizationName = 'EventGo Demo Agency (Hà Nội)';
          if (profileRow.organization_id) {
            const { data: orgData } = await supabase
              .from('organizations')
              .select('name')
              .eq('id', profileRow.organization_id)
              .single();
            const orgRow = orgData as { name: string } | null;
            if (orgRow?.name) {
              organizationName = orgRow.name;
            }
          }

          return {
            user: {
              id: profileRow.id,
              organizationId: profileRow.organization_id,
              email: profileRow.email,
              fullName: profileRow.full_name,
              phone: profileRow.phone,
              role: profileRow.role,
              createdAt: new Date(profileRow.created_at),
              updatedAt: new Date(profileRow.updated_at),
            },
            organizationName,
          };
        }
      }
    } catch (err) {
      console.warn('Could not retrieve Supabase user session:', err);
    }
  }

  // Fallback demo session from cookie or default to PM
  const demoEmail = cookieStore.get('eventgo_demo_user')?.value?.toLowerCase() || 'pm1@eventgo.vn';
  const demoInfo = DEMO_PROFILES[demoEmail] || DEMO_PROFILES['pm1@eventgo.vn'];

  return {
    user: {
      id: demoInfo.id,
      organizationId: 'a0000000-0000-0000-0000-000000000001',
      email: demoEmail,
      fullName: demoInfo.name,
      role: demoInfo.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    organizationName: 'EventGo Demo Agency (Hà Nội)',
  };
}

