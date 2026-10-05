import { CampaignInvite, CampaignMember, CampaignMemberHistory } from '@/domain/entities';
import { CampaignRole } from '@/domain/enums';

export interface CampaignMemberRepository {
  findByCampaign(campaignId: string): Promise<CampaignMember[]>;
  findInvitesByCampaign(campaignId: string): Promise<CampaignInvite[]>;
  findHistoryByCampaign(campaignId: string): Promise<CampaignMemberHistory[]>;
  invite(campaignId: string, email: string, role: CampaignRole): Promise<string>;
  setAccess(memberId: string, role: CampaignRole, revoke: boolean): Promise<void>;
}
