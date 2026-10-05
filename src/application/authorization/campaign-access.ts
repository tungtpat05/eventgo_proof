import { AuthorizationError } from '@/domain/errors';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

export async function requireCampaignManager(campaignId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('is_campaign_manager', { target_campaign_id: campaignId });
  if (error || !data) throw new AuthorizationError('Chỉ Manager của chiến dịch mới được thực hiện hành động này.');
}

export async function requireAssignedSupervisor(locationId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('is_location_supervisor', { target_location_id: locationId });
  if (error || !data) throw new AuthorizationError('Chỉ Supervisor được phân công tại địa điểm này mới có quyền nộp evidence.');
}

export async function requireAssignedApprover(submissionId: string): Promise<void> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('is_submission_approver', { target_submission_id: submissionId });
  if (error || !data) throw new AuthorizationError('Chỉ Approver được phân công cho submission này mới có quyền duyệt.');
}
