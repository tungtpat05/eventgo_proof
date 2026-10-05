'use server';

import { createCampaignUseCase } from '@/application/use-cases/campaigns/create-campaign';
import { CampaignStatus } from '@/domain/enums';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { formatActionError } from '@/lib/action-error';

export interface CampaignActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createCampaignAction(
  prevState: CampaignActionState | null,
  formData: FormData
): Promise<CampaignActionState> {
  const title = formData.get('title') as string;
  const brandName = formData.get('brandName') as string;
  const description = (formData.get('description') as string) || '';
  const companyName = formData.get('companyName') as string;
  const companyTaxCode = (formData.get('companyTaxCode') as string) || '';
  const companyAddress = (formData.get('companyAddress') as string) || '';
  const companyContactName = (formData.get('companyContactName') as string) || '';
  const companyContactEmail = (formData.get('companyContactEmail') as string) || '';
  const companyContactPhone = (formData.get('companyContactPhone') as string) || '';
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const status = (formData.get('status') as CampaignStatus) || CampaignStatus.DRAFT;

  try {
    const campaign = await createCampaignUseCase({
      title,
      brandName,
      description,
      companyName,
      companyTaxCode,
      companyAddress,
      companyContactName,
      companyContactEmail,
      companyContactPhone,
      startDate,
      endDate,
      status,
    });

    revalidatePath('/campaigns');
    revalidatePath('/dashboard');
    redirect(`/campaigns/${campaign.id}`);
  } catch (err: unknown) {
    return formatActionError(err, 'Lỗi khi tạo chiến dịch.');
  }
}
