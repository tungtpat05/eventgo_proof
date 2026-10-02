import { Submission, Evidence, ApprovalHistory } from '@/domain/entities';
import { SubmissionStatus, ApprovalAction } from '@/domain/enums';

export interface SubmissionRepository {
  findById(id: string): Promise<Submission | null>;
  findByLocation(locationId: string): Promise<Submission[]>;
  findByChecklistItem(locationId: string, checklistItemId: string): Promise<Submission | null>;
  findPendingReviews(organizationId: string): Promise<Submission[]>;
  submit(params: {
    locationId: string;
    checklistItemId: string;
    notes?: string;
    submittedBy: string;
    photos: Array<{ imageUrl: string; thumbnailUrl?: string; cloudinaryPublicId: string }>;
  }): Promise<Submission>;
  review(params: {
    submissionId: string;
    reviewerId: string;
    action: ApprovalAction;
    notes?: string;
  }): Promise<void>;
}
