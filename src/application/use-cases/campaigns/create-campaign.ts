import { Campaign } from '@/domain/entities';
import { SupabaseCampaignRepository } from '@/infrastructure/repositories/supabase-campaign-repository';
import { getCurrentUserSession } from '../auth/get-current-user';
import { campaignSchema, CampaignInput } from '@/application/validation/campaign-schema';

export async function createCampaignUseCase(input: CampaignInput): Promise<Campaign> {
  const session = await getCurrentUserSession();

  const validated = campaignSchema.parse(input);

  const repo = new SupabaseCampaignRepository();
  return await repo.save({
    title: validated.title,
    brandName: validated.brandName,
    description: validated.description,
    companyName: validated.companyName,
    companyTaxCode: validated.companyTaxCode,
    companyAddress: validated.companyAddress,
    companyContactName: validated.companyContactName,
    companyContactEmail: validated.companyContactEmail,
    companyContactPhone: validated.companyContactPhone,
    startDate: new Date(validated.startDate),
    endDate: new Date(validated.endDate),
    status: validated.status,
    createdBy: session.user.id,
  });
}
