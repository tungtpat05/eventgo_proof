import { CampaignInvite, CampaignMember, CampaignMemberHistory } from '@/domain/entities';
import { CampaignRole } from '@/domain/enums';
import { CampaignMemberRepository } from '@/domain/repositories/campaign-member-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

export class SupabaseCampaignMemberRepository implements CampaignMemberRepository {
  async findByCampaign(campaignId: string): Promise<CampaignMember[]> {
    const supabase = await createServerSupabaseClient();
    const { data: memberships, error } = await supabase
      .from('campaign_members')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at');
    if (error) throw new Error(error.message);
    if (memberships.length === 0) return [];

    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url')
      .in('id', memberships.map((membership) => membership.user_id));
    if (profileError) throw new Error(profileError.message);
    const profilesById = new Map(profiles.map((profile) => [profile.id, profile]));

    return memberships.flatMap((membership) => {
      const profile = profilesById.get(membership.user_id);
      if (!profile) return [];
      return [{
        id: membership.id,
        campaignId: membership.campaign_id,
        userId: membership.user_id,
        email: profile.email,
        fullName: profile.full_name,
        avatarUrl: profile.avatar_url,
        role: membership.role,
        status: membership.status,
        createdAt: new Date(membership.created_at),
        updatedAt: new Date(membership.updated_at),
      }];
    });
  }

  async findInvitesByCampaign(campaignId: string): Promise<CampaignInvite[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('campaign_invites')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(error.message);
    return data.map((invite) => ({
      id: invite.id,
      campaignId: invite.campaign_id,
      email: invite.email,
      role: invite.role,
      status: invite.status,
      createdAt: new Date(invite.created_at),
    }));
  }

  async findHistoryByCampaign(campaignId: string): Promise<CampaignMemberHistory[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('campaign_member_history')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw new Error(error.message);
    return data.map((item) => ({
      id: item.id,
      memberUserId: item.member_user_id,
      previousRole: item.previous_role,
      newRole: item.new_role,
      previousStatus: item.previous_status,
      newStatus: item.new_status,
      createdAt: new Date(item.created_at),
    }));
  }

  async invite(campaignId: string, email: string, role: CampaignRole): Promise<string> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.rpc('invite_campaign_member', {
      p_campaign_id: campaignId,
      p_email: email,
      p_role: role,
    });
    if (error) throw new Error(error.message);
    return data;
  }

  async setAccess(memberId: string, role: CampaignRole, revoke: boolean): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('set_campaign_member_access', {
      p_member_id: memberId,
      p_role: role,
      p_revoke: revoke,
    });
    if (error) throw new Error(error.message);
  }
}
