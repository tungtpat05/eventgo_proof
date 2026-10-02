import { ChecklistItem } from '@/domain/entities';

export interface ChecklistRepository {
  findByCampaign(campaignId: string): Promise<ChecklistItem[]>;
  save(item: Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<ChecklistItem>;
  bulkSave(items: Array<Omit<ChecklistItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<ChecklistItem[]>;
  delete(id: string): Promise<void>;
}
