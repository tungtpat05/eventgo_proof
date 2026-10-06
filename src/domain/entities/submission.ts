import { SubmissionStatus } from '@/domain/enums';
import { Evidence } from './evidence';
import { ApprovalHistory } from './approval-history';

export interface Submission {
  id: string;
  boothId: string;
  checklistItemId: string;
  assignedApproverMemberId: string;
  status: SubmissionStatus;
  notes?: string | null;
  submittedBy?: string | null;
  submittedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  evidence?: Evidence[];
  history?: ApprovalHistory[];
}
