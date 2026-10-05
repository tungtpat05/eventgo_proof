import { Campaign } from '@/domain/entities';
import { SupabaseCampaignRepository } from '@/infrastructure/repositories/supabase-campaign-repository';
import { getCurrentUserSession } from '../auth/get-current-user';

export async function getCampaignsUseCase(): Promise<Campaign[]> {
  const session = await getCurrentUserSession();
  const repo = new SupabaseCampaignRepository();
  return await repo.findAccessibleByUser(session.user.id);
}
