import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

export interface ActivationReadinessResult {
  canActivate: boolean;
  errors: string[];
}

export async function validateCampaignActivationUseCase(campaignId: string): Promise<ActivationReadinessResult> {
  const supabase = await createServerSupabaseClient();
  const { data, error } = await supabase.rpc('check_campaign_activation_readiness', {
    p_campaign_id: campaignId,
  });

  if (error) {
    throw new Error(`Lỗi kiểm tra điều kiện kích hoạt: ${error.message}`);
  }

  // data is { can_activate: boolean, errors: string[] }
  const res = data as unknown as { can_activate: boolean; errors: string[] };
  return {
    canActivate: res.can_activate,
    errors: res.errors || [],
  };
}
