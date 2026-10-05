import { Location } from '@/domain/entities';
import { ValidationError } from '@/domain/errors';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { ParsedLocationRow } from '@/infrastructure/excel/excel-import-service';
import { requireCampaignManager } from '@/application/authorization/campaign-access';

export async function bulkImportLocationsUseCase(
  campaignId: string,
  rows: ParsedLocationRow[]
): Promise<{ count: number; locations: Location[] }> {
  if (!campaignId) {
    throw new ValidationError('Mã chiến dịch không được để trống.');
  }

  if (!rows || rows.length === 0) {
    throw new ValidationError('Không có dòng dữ liệu hợp lệ nào để import.');
  }

  await requireCampaignManager(campaignId);

  const repo = new SupabaseLocationRepository();
  const toInsert = rows.map((r) => ({
    campaignId,
    name: r.name,
    address: r.address,
    city: r.city,
    deadline: null,
  }));

  const created = await repo.bulkSave(toInsert);
  return { count: created.length, locations: created };
}
