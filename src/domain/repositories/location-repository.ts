import { Location } from '@/domain/entities';

export type LocationWriteInput = Omit<
  Location,
  | 'id'
  | 'supervisorMemberId'
  | 'supervisorName'
  | 'approverMemberId'
  | 'approverName'
  | 'createdAt'
  | 'updatedAt'
> & { id?: string };

export interface LocationRepository {
  findById(id: string): Promise<Location | null>;
  findByCampaign(campaignId: string): Promise<Location[]>;
  findAccessible(): Promise<Location[]>;
  save(location: LocationWriteInput): Promise<Location>;
  bulkSave(locations: LocationWriteInput[]): Promise<Location[]>;
  assignPersonnel(
    locationId: string,
    supervisorMemberId?: string | null,
    approverMemberId?: string | null,
    deadline?: Date | null
  ): Promise<void>;
  delete(id: string): Promise<void>;
}
