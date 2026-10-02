import { Location } from '@/domain/entities';
import { UserRole } from '@/domain/enums';
import { AuthorizationError } from '@/domain/errors';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { getCurrentUserSession } from '../auth/get-current-user';
import { locationSchema, LocationInput } from '@/application/validation/location-schema';

export async function createLocationUseCase(input: LocationInput): Promise<Location> {
  const session = await getCurrentUserSession();

  if (session.user.role !== UserRole.PROJECT_MANAGER) {
    throw new AuthorizationError('Chỉ Quản lý dự án (Project Manager) mới có quyền tạo địa điểm.');
  }

  const validated = locationSchema.parse(input);
  const repo = new SupabaseLocationRepository();

  return await repo.save({
    campaignId: validated.campaignId,
    organizationId: session.user.organizationId,
    name: validated.name,
    address: validated.address,
    city: validated.city,
    assignedSupervisorId: validated.assignedSupervisorId || null,
    assignedApproverId: validated.assignedApproverId || null,
    deadline: validated.deadline ? new Date(validated.deadline) : null,
  });
}
