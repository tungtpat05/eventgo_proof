import { ApprovalAction } from '@/domain/enums';

export interface ApprovalHistory {
  id: string;
  submissionId: string;
  reviewerId: string;
  action: ApprovalAction;
  notes?: string | null;
  createdAt: Date;
}
