import { Location } from '@/domain/entities';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { locationSchema, LocationInput } from '@/application/validation/location-schema';
import { requireCampaignManager } from '@/application/authorization/campaign-access';

export async function createLocationUseCase(input: LocationInput): Promise<Location> {
  const validated = locationSchema.parse(input);
  await requireCampaignManager(validated.campaignId);
  const repo = new SupabaseLocationRepository();

  return await repo.save({
    campaignId: validated.campaignId,
    name: validated.name,
    address: validated.address,
    city: validated.city,
    deadline: validated.deadline ? new Date(validated.deadline) : null,
  });
}
