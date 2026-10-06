import { Booth } from '@/domain/entities';
import { SupabaseBoothRepository } from '@/infrastructure/repositories/supabase-booth-repository';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { requireCampaignManager } from '@/application/authorization/campaign-access';

export interface CreateBoothInput {
  locationId: string;
  name: string;
  code?: string | null;
  description?: string | null;
  deadline?: Date | null;
}

export interface UpdateBoothInput {
  id: string;
  name: string;
  code?: string | null;
  description?: string | null;
  deadline?: Date | null;
}

export async function createBoothUseCase(input: CreateBoothInput): Promise<Booth> {
  const locRepo = new SupabaseLocationRepository();
  const location = await locRepo.findById(input.locationId);
  if (!location) throw new Error('Địa điểm không tồn tại');

  await requireCampaignManager(location.campaignId);

  const boothRepo = new SupabaseBoothRepository();
  return await boothRepo.save({
    locationId: input.locationId,
    name: input.name,
    code: input.code,
    description: input.description,
    deadline: input.deadline,
  });
}

export async function updateBoothUseCase(input: UpdateBoothInput): Promise<Booth> {
  const boothRepo = new SupabaseBoothRepository();
  const booth = await boothRepo.findById(input.id);
  if (!booth) throw new Error('Gian hàng không tồn tại');

  const locRepo = new SupabaseLocationRepository();
  const location = await locRepo.findById(booth.locationId);
  if (!location) throw new Error('Địa điểm không tồn tại');

  await requireCampaignManager(location.campaignId);

  return await boothRepo.save({
    id: input.id,
    locationId: booth.locationId,
    name: input.name,
    code: input.code,
    description: input.description,
    deadline: input.deadline,
  });
}

export async function deleteBoothUseCase(id: string): Promise<void> {
  const boothRepo = new SupabaseBoothRepository();
  const booth = await boothRepo.findById(id);
  if (!booth) return;

  const locRepo = new SupabaseLocationRepository();
  const location = await locRepo.findById(booth.locationId);
  if (location) {
    await requireCampaignManager(location.campaignId);
  }

  await boothRepo.delete(id);
}

export async function assignBoothPersonnelUseCase(params: {
  boothId: string;
  supervisorMemberId?: string | null;
  approverMemberId?: string | null;
  deadline?: Date | null;
}): Promise<void> {
  const boothRepo = new SupabaseBoothRepository();
  const booth = await boothRepo.findById(params.boothId);
  if (!booth) throw new Error('Gian hàng không tồn tại');

  const locRepo = new SupabaseLocationRepository();
  const location = await locRepo.findById(booth.locationId);
  if (!location) throw new Error('Địa điểm không tồn tại');

  await requireCampaignManager(location.campaignId);

  await boothRepo.assignPersonnel(
    params.boothId,
    params.supervisorMemberId,
    params.approverMemberId,
    params.deadline
  );
}

export async function getBoothsByLocationUseCase(locationId: string): Promise<Booth[]> {
  const boothRepo = new SupabaseBoothRepository();
  return await boothRepo.findByLocation(locationId);
}

export async function getBoothDetailsUseCase(id: string): Promise<Booth | null> {
  const boothRepo = new SupabaseBoothRepository();
  return await boothRepo.findById(id);
}
