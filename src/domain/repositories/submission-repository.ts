import { Submission } from '@/domain/entities';
import { ApprovalAction } from '@/domain/enums';

export interface SubmissionRepository {
  findById(id: string): Promise<Submission | null>;
  findByBooth(boothId: string): Promise<Submission[]>;
  findByChecklistItem(boothId: string, checklistItemId: string): Promise<Submission | null>;
  findPendingReviews(userId: string): Promise<Submission[]>;
  submit(params: {
    boothId: string;
    checklistItemId: string;
    notes?: string;
    photos: Array<{ imageUrl: string; thumbnailUrl?: string; cloudinaryPublicId: string }>;
  }): Promise<Submission>;
  review(params: {
    submissionId: string;
    action: ApprovalAction;
    notes?: string;
  }): Promise<void>;
}
