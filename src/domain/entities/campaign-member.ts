import { CampaignMemberStatus, CampaignRole } from '@/domain/enums';

export interface CampaignMember {
  id: string;
  campaignId: string;
  userId: string;
  email: string;
  fullName: string;
  avatarUrl?: string | null;
  role: CampaignRole;
  status: CampaignMemberStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CampaignInvite {
  id: string;
  campaignId: string;
  email: string;
  role: CampaignRole;
  status: string;
  createdAt: Date;
}

export interface CampaignMemberHistory {
  id: string;
  memberUserId: string;
  previousRole?: CampaignRole | null;
  newRole?: CampaignRole | null;
  previousStatus?: CampaignMemberStatus | null;
  newStatus: CampaignMemberStatus;
  createdAt: Date;
}
