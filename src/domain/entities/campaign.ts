import { CampaignStatus } from '@/domain/enums';

export interface Campaign {
  id: string;
  organizationId: string;
  title: string;
  brandName: string;
  description?: string | null;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  createdBy?: string | null;
  createdAt: Date;
  updatedAt: Date;
}
