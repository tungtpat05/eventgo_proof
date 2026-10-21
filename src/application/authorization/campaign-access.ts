import { AuthorizationError } from '@/domain/errors';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { env } from '@/config/env';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { CampaignRole, CampaignMemberStatus } from '@/domain/enums';

export async function requireCampaignManager(campaignId: string): Promise<void> {
  const session = await getCurrentUserSession();
  const currentUserId = session?.user?.id;
  if (!currentUserId) {
    throw new AuthorizationError('Chỉ Manager của chiến dịch mới được thực hiện hành động này.');
  }

  if (env.SUPABASE_SERVICE_ROLE_KEY) {
    const admin = createAdminSupabaseClient();
    const { data: member } = await admin
      .from('campaign_members')
      .select('id')
      .eq('campaign_id', campaignId)
      .eq('user_id', currentUserId)
      .eq('role', CampaignRole.MANAGER)
      .eq('status', CampaignMemberStatus.ACTIVE)
      .maybeSingle();

    if (member) return;
  }

  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('is_campaign_manager', { target_campaign_id: campaignId });
  if (error || !data) throw new AuthorizationError('Chỉ Manager của chiến dịch mới được thực hiện hành động này.');
}

export async function requireAssignedSupervisor(boothId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('is_booth_supervisor', { target_booth_id: boothId });
  if (error || !data) throw new AuthorizationError('Chỉ Supervisor được phân công tại gian hàng này mới có quyền nộp evidence.');
}

export async function requireAssignedApprover(submissionId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('is_submission_approver', { target_submission_id: submissionId });
  if (error || !data) throw new AuthorizationError('Chỉ Approver được phân công cho submission này mới có quyền duyệt.');
}
