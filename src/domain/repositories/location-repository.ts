import { Location } from '@/domain/entities';

export type LocationWriteInput = Omit<
  Location,
  'id' | 'booths' | 'createdAt' | 'updatedAt'
> & { id?: string };

export interface LocationRepository {
  findById(id: string): Promise<Location | null>;
  findByCampaign(campaignId: string): Promise<Location[]>;
  findAccessible(): Promise<Location[]>;
  save(location: LocationWriteInput): Promise<Location>;
  bulkSave(locations: LocationWriteInput[]): Promise<Location[]>;
  delete(id: string): Promise<void>;
}
