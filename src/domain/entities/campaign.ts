import { CampaignRole, CampaignStatus } from '@/domain/enums';

export interface Campaign {
  id: string;
  title: string;
  brandName: string;
  description?: string | null;
  companyName: string;
  companyTaxCode?: string | null;
  companyAddress?: string | null;
  companyContactName?: string | null;
  companyContactEmail?: string | null;
  companyContactPhone?: string | null;
  startDate: Date;
  endDate: Date;
  status: CampaignStatus;
  createdBy: string;
  currentUserRole: CampaignRole;
  createdAt: Date;
  updatedAt: Date;
}
