import { CampaignStatus } from '@/domain/enums';
import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { validateCampaignActivationUseCase } from './validate-campaign-activation';

export async function activateCampaignUseCase(campaignId: string): Promise<void> {
  await requireCampaignManager(campaignId);

  // 1. Kiểm tra toàn bộ điều kiện bắt buộc
  const readiness = await validateCampaignActivationUseCase(campaignId);
  if (!readiness.canActivate) {
    throw new Error(`Chiến dịch chưa đủ điều kiện kích hoạt:\n- ${readiness.errors.join('\n- ')}`);
  }

  // 2. Chuyển trạng thái sang ACTIVE
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase
    .from('campaigns')
    .update({ status: CampaignStatus.ACTIVE })
    .eq('id', campaignId);

  if (error) {
    throw new Error(`Kích hoạt chiến dịch thất bại: ${error.message}`);
  }
}
