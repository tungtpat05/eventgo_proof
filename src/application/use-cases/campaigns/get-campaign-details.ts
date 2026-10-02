import { Campaign } from '@/domain/entities';
import { SupabaseCampaignRepository } from '@/infrastructure/repositories/supabase-campaign-repository';
import { NotFoundError } from '@/domain/errors';

export async function getCampaignDetailsUseCase(campaignId: string): Promise<Campaign> {
  const repo = new SupabaseCampaignRepository();
  const campaign = await repo.findById(campaignId);
  if (!campaign) {
    throw new NotFoundError('Chiến dịch', campaignId);
  }
  return campaign;
}
