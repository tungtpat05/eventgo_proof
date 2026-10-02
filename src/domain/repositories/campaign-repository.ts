import { Campaign } from '@/domain/entities';

export interface CampaignRepository {
  findById(id: string): Promise<Campaign | null>;
  findByOrganization(organizationId: string): Promise<Campaign[]>;
  save(campaign: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Campaign>;
  updateStatus(id: string, status: Campaign['status']): Promise<void>;
  delete(id: string): Promise<void>;
}
