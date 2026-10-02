import { Campaign } from '@/domain/entities';
import { UserRole } from '@/domain/enums';
import { AuthorizationError } from '@/domain/errors';
import { SupabaseCampaignRepository } from '@/infrastructure/repositories/supabase-campaign-repository';
import { getCurrentUserSession } from '../auth/get-current-user';
import { campaignSchema, CampaignInput } from '@/application/validation/campaign-schema';

export async function createCampaignUseCase(input: CampaignInput): Promise<Campaign> {
  const session = await getCurrentUserSession();

  // Enforce PM authorization
  if (session.user.role !== UserRole.PROJECT_MANAGER) {
    throw new AuthorizationError('Chỉ Quản lý dự án (Project Manager) mới có quyền tạo chiến dịch.');
  }

  // Validate business rules
  const validated = campaignSchema.parse(input);

  const repo = new SupabaseCampaignRepository();
  return await repo.save({
    organizationId: session.user.organizationId,
    title: validated.title,
    brandName: validated.brandName,
    description: validated.description,
    startDate: new Date(validated.startDate),
    endDate: new Date(validated.endDate),
    status: validated.status,
    createdBy: session.user.id,
  });
}
