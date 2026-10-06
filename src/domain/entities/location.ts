import { Booth } from './booth';

export interface Location {
  id: string;
  campaignId: string;
  name: string;
  address: string;
  city: string;
  deadline?: Date | null;
  defaultSupervisorMemberId?: string | null;
  defaultSupervisorName?: string | null;
  booths?: Booth[];
  createdAt: Date;
  updatedAt: Date;
}
