import { Booth } from '@/domain/entities';

export type BoothWriteInput = Omit<
  Booth,
  | 'id'
  | 'supervisorMemberId'
  | 'supervisorName'
  | 'approverMemberId'
  | 'approverName'
  | 'checklistCount'
  | 'completedChecklistCount'
  | 'createdAt'
  | 'updatedAt'
> & { id?: string };

export interface BoothRepository {
  findById(id: string): Promise<Booth | null>;
  findByLocation(locationId: string): Promise<Booth[]>;
  findByCampaign(campaignId: string): Promise<Booth[]>;
  save(booth: BoothWriteInput): Promise<Booth>;
  assignPersonnel(
    boothId: string,
    supervisorMemberId?: string | null,
    approverMemberId?: string | null,
    deadline?: Date | null
  ): Promise<void>;
  delete(id: string): Promise<void>;
}
