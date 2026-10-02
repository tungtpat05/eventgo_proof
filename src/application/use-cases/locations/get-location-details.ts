import { Location } from '@/domain/entities';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { NotFoundError } from '@/domain/errors';

export async function getLocationDetailsUseCase(locationId: string): Promise<Location> {
  const repo = new SupabaseLocationRepository();
  const location = await repo.findById(locationId);
  if (!location) {
    throw new NotFoundError('Địa điểm', locationId);
  }
  return location;
}
