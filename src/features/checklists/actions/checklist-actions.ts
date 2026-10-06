'use server';

import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';
import { ChecklistCategory } from '@/domain/enums';
import { revalidatePath } from 'next/cache';
import { requireCampaignManager } from '@/application/authorization/campaign-access';

export async function createChecklistItemAction(formData: FormData) {
  const boothId = formData.get('boothId') as string;
  const campaignId = formData.get('campaignId') as string;
  const title = (formData.get('title') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || '';
  const category = (formData.get('category') as ChecklistCategory) || ChecklistCategory.OTHER;
  const isRequired = formData.get('isRequired') !== 'false';

  if (!boothId || !title) {
    return { error: 'Tiêu chí và gian hàng không được để trống.' };
  }

  try {
    if (campaignId) {
      await requireCampaignManager(campaignId);
    }
    const repo = new SupabaseChecklistRepository();
    const existing = await repo.findByBooth(boothId);
    await repo.save({
      boothId,
      title,
      description,
      category,
      isRequired,
      orderIndex: existing.length + 1,
    });

    if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi thêm tiêu chí nghiệm thu.';
    return { error: message };
  }
}

export async function deleteChecklistItemAction(id: string, campaignId?: string) {
  try {
    if (campaignId) {
      await requireCampaignManager(campaignId);
    }
    const repo = new SupabaseChecklistRepository();
    await repo.delete(id);

    if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi xóa tiêu chí nghiệm thu.';
    return { error: message };
  }
}

export async function getBoothChecklistItemsAction(boothId: string) {
  try {
    const repo = new SupabaseChecklistRepository();
    const items = await repo.findByBooth(boothId);
    return { items };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi lấy danh sách checklist.';
    return { error: message, items: [] };
  }
}
