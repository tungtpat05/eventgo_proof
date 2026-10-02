import { ChecklistItem } from '@/domain/entities';
import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';

export async function getChecklistItemsUseCase(campaignId: string): Promise<ChecklistItem[]> {
  const repo = new SupabaseChecklistRepository();
  return await repo.findByCampaign(campaignId);
}
