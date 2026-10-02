import { Location } from '@/domain/entities';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { getCurrentUserSession } from '../auth/get-current-user';

export async function getLocationsUseCase(campaignId?: string): Promise<Location[]> {
  const session = await getCurrentUserSession();
  const repo = new SupabaseLocationRepository();

  if (campaignId) {
    return await repo.findByCampaign(campaignId);
  }

  return await repo.findByOrganization(session.user.organizationId);
}
