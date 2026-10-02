'use server';

import { createCampaignUseCase } from '@/application/use-cases/campaigns/create-campaign';
import { CampaignStatus } from '@/domain/enums';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

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
  const startDate = formData.get('startDate') as string;
  const endDate = formData.get('endDate') as string;
  const status = (formData.get('status') as CampaignStatus) || CampaignStatus.DRAFT;

  try {
    const campaign = await createCampaignUseCase({
      title,
      brandName,
      description,
      startDate,
      endDate,
      status,
    });

    revalidatePath('/campaigns');
    revalidatePath('/dashboard');
    redirect(`/campaigns/${campaign.id}`);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'digest' in err) {
      // Next.js redirect throw
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Lỗi khi tạo chiến dịch.';
    return { error: message };
  }
}
