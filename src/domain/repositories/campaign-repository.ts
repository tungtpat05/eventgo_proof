import { Campaign } from '@/domain/entities';

export type CampaignWriteInput = Omit<Campaign, 'id' | 'currentUserRole' | 'createdAt' | 'updatedAt'> & {
  id?: string;
};

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findAccessibleByUser(userId: string): Promise<Campaign[]>;
  save(campaign: CampaignWriteInput): Promise<Campaign>;
  updateStatus(id: string, status: Campaign['status']): Promise<void>;
  delete(id: string): Promise<void>;
}
