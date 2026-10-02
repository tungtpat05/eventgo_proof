import { Location } from '@/domain/entities';

export interface LocationRepository {
  findById(id: string): Promise<Location | null>;
  findByCampaign(campaignId: string): Promise<Location[]>;
  findByOrganization(organizationId: string): Promise<Location[]>;
  findBySupervisor(supervisorId: string): Promise<Location[]>;
  save(location: Omit<Location, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): Promise<Location>;
  bulkSave(locations: Array<Omit<Location, 'id' | 'createdAt' | 'updatedAt'>>): Promise<Location[]>;
  assignPersonnel(locationId: string, supervisorId?: string | null, approverId?: string | null, deadline?: Date | null): Promise<void>;
  delete(id: string): Promise<void>;
}
