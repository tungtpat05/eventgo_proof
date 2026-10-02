import { Location } from '@/domain/entities';
import { UserRole } from '@/domain/enums';
import { AuthorizationError, ValidationError } from '@/domain/errors';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { getCurrentUserSession } from '../auth/get-current-user';
import { ParsedLocationRow } from '@/infrastructure/excel/excel-import-service';

export async function bulkImportLocationsUseCase(
  campaignId: string,
  rows: ParsedLocationRow[]
): Promise<{ count: number; locations: Location[] }> {
  const session = await getCurrentUserSession();

  if (session.user.role !== UserRole.PROJECT_MANAGER) {
    throw new AuthorizationError('Chỉ Quản lý dự án mới có quyền import danh sách địa điểm.');
  }

  if (!campaignId) {
    throw new ValidationError('Mã chiến dịch không được để trống.');
  }

  if (!rows || rows.length === 0) {
    throw new ValidationError('Không có dòng dữ liệu hợp lệ nào để import.');
  }

  const repo = new SupabaseLocationRepository();
  const toInsert = rows.map((r) => ({
    campaignId,
    organizationId: session.user.organizationId,
    name: r.name,
    address: r.address,
    city: r.city,
    assignedSupervisorId: null,
    assignedApproverId: null,
    deadline: null,
  }));

  const created = await repo.bulkSave(toInsert);
  return { count: created.length, locations: created };
}
