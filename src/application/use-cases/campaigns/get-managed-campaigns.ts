import { Campaign } from '@/domain/entities';
import { CampaignRole } from '@/domain/enums';
import { getCampaignsUseCase } from './get-campaigns';

export async function getManagedCampaignsUseCase(): Promise<Campaign[]> {
  const campaigns = await getCampaignsUseCase();
  return campaigns.filter((c) => c.currentUserRole === CampaignRole.MANAGER);
}
