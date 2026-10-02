'use server';

import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';
import { ChecklistCategory } from '@/domain/enums';
import { revalidatePath } from 'next/cache';

export async function createChecklistItemAction(formData: FormData) {
  const campaignId = formData.get('campaignId') as string;
  const title = formData.get('title') as string;
  const description = (formData.get('description') as string) || '';
  const category = (formData.get('category') as ChecklistCategory) || ChecklistCategory.OTHER;
  const isRequired = formData.get('isRequired') === 'true';

  if (!campaignId || !title) {
    return { error: 'Tiêu chí và chiến dịch không được để trống.' };
  }

  try {
    const repo = new SupabaseChecklistRepository();
    const existing = await repo.findByCampaign(campaignId);
    await repo.save({
      campaignId,
      title,
      description,
      category,
      isRequired,
      orderIndex: existing.length + 1,
    });

    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi thêm tiêu chí nghiệm thu.';
    return { error: message };
  }
}
