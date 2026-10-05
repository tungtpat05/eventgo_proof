import { Location } from '@/domain/entities';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';

export async function getLocationsUseCase(campaignId?: string): Promise<Location[]> {
  const repo = new SupabaseLocationRepository();

  if (campaignId) {
    return await repo.findByCampaign(campaignId);
  }

  return await repo.findAccessible();
}
