import { SystemAdminInvite, SystemAdminInviteStatus, UserProfile } from '@/domain/entities';
import { SystemAdminRepository } from '@/domain/repositories/system-admin-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database } from '@/types/database.types';

type InviteRow = Database['public']['Tables']['system_admin_invites']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];

function mapInvite(row: InviteRow): SystemAdminInvite {
  return {
    id: row.id,
    email: row.email,
    invitedBy: row.invited_by,
    status: row.status as SystemAdminInviteStatus,
    acceptedAt: row.accepted_at ? new Date(row.accepted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    phone: row.phone,
    isSystemAdmin: row.is_system_admin ?? false,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class SupabaseSystemAdminRepository implements SystemAdminRepository {
  async getAdmins(): Promise<UserProfile[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('is_system_admin', true)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return (data || []).map(mapProfile);
  }

  async getInvites(status?: SystemAdminInviteStatus): Promise<SystemAdminInvite[]> {
    const supabase = await createServerSupabaseClient();
    let query = supabase.from('system_admin_invites').select('*');
    if (status) query = query.eq('status', status);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw new Error(error.message);
    return (data || []).map(mapInvite);
  }

  async createInvite(email: string, invitedBy: string): Promise<SystemAdminInvite> {
    const supabase = await createServerSupabaseClient();
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user is already an admin
    const { data: existingAdmin } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', normalizedEmail)
      .eq('is_system_admin', true)
      .maybeSingle();

    if (existingAdmin) {
      throw new Error('Tài khoản này đã là Quản trị viên hệ thống.');
    }

    const { data, error } = await supabase
      .from('system_admin_invites')
      .upsert(
        {
          email: normalizedEmail,
          invited_by: invitedBy,
          status: SystemAdminInviteStatus.PENDING,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'email' }
      )
      .select('*')
      .single();

    if (error) throw new Error(error.message);
    return mapInvite(data);
  }

  async revokeInvite(inviteId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase
      .from('system_admin_invites')
      .update({
        status: SystemAdminInviteStatus.REVOKED,
        updated_at: new Date().toISOString(),
      })
      .eq('id', inviteId);

    if (error) throw new Error(error.message);
  }

  async revokeAdminRole(userId: string): Promise<void> {
    const supabase = await createServerSupabaseClient();

    // Check last admin standing rule
    const { count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('is_system_admin', true);

    if ((count || 0) <= 1) {
      throw new Error('Không thể thu hồi: Hệ thống phải có ít nhất 1 Quản trị viên.');
    }

    const { error } = await supabase
      .from('profiles')
      .update({
        is_system_admin: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (error) throw new Error(error.message);
  }

  async isSystemAdmin(userId: string): Promise<boolean> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('is_system_admin')
      .eq('id', userId)
      .maybeSingle();

    if (error || !data) return false;
    return !!data.is_system_admin;
  }
}
