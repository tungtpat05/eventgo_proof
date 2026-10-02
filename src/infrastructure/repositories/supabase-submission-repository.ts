import { SubmissionRepository } from '@/domain/repositories/submission-repository';
import { Submission, Evidence, ApprovalHistory } from '@/domain/entities';
import { SubmissionStatus, ApprovalAction } from '@/domain/enums';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { env } from '@/config/env';

// In-memory submissions for local prototyping & demonstration
let inMemorySubmissions: Submission[] = [
  {
    id: 'sub-vincom-1',
    locationId: 'loc-vincom-ba-trieu',
    checklistItemId: 'item-booth-structure',
    status: SubmissionStatus.APPROVED,
    notes: 'Đã hoàn thiện lắp đặt khung sắt và sàn nâng theo đúng 3D.',
    submittedBy: 'demo-supervisor-uuid',
    submittedAt: new Date('2026-06-10T10:00:00Z'),
    createdAt: new Date('2026-06-10T09:30:00Z'),
    updatedAt: new Date('2026-06-10T11:00:00Z'),
    evidence: [
      {
        id: 'evi-1',
        submissionId: 'sub-vincom-1',
        imageUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&auto=format&fit=crop&q=80',
        cloudinaryPublicId: 'demo/booth-full',
        uploadedBy: 'demo-supervisor-uuid',
        createdAt: new Date('2026-06-10T09:45:00Z'),
      },
    ],
    history: [
      {
        id: 'hist-1',
        submissionId: 'sub-vincom-1',
        reviewerId: 'demo-approver-uuid',
        action: ApprovalAction.APPROVE,
        notes: 'Gian hàng đạt chuẩn thiết kế, kết cấu vững chãi.',
        createdAt: new Date('2026-06-10T11:00:00Z'),
      },
    ],
  },
  {
    id: 'sub-vincom-2',
    locationId: 'loc-vincom-ba-trieu',
    checklistItemId: 'item-brand-logo',
    status: SubmissionStatus.NEEDS_REVISION,
    notes: 'Logo dán trên mặt trước quầy.',
    submittedBy: 'demo-supervisor-uuid',
    submittedAt: new Date('2026-06-10T10:15:00Z'),
    createdAt: new Date('2026-06-10T10:00:00Z'),
    updatedAt: new Date('2026-06-10T11:05:00Z'),
    evidence: [
      {
        id: 'evi-2',
        submissionId: 'sub-vincom-2',
        imageUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=300&auto=format&fit=crop&q=80',
        cloudinaryPublicId: 'demo/logo-dim',
        uploadedBy: 'demo-supervisor-uuid',
        createdAt: new Date('2026-06-10T10:10:00Z'),
      },
    ],
    history: [
      {
        id: 'hist-2',
        submissionId: 'sub-vincom-2',
        reviewerId: 'demo-approver-uuid',
        action: ApprovalAction.REQUEST_REVISION,
        notes: 'Ảnh logo bị mờ và lóa đèn sảnh, vui lòng chụp lại rõ nét trực diện.',
        createdAt: new Date('2026-06-10T11:05:00Z'),
      },
    ],
  },
  {
    id: 'sub-vincom-3',
    locationId: 'loc-vincom-ba-trieu',
    checklistItemId: 'item-posm-display',
    status: SubmissionStatus.SUBMITTED,
    notes: 'Đã dựng 2 standee hai bên lối vào và đặt tờ rơi tại quầy.',
    submittedBy: 'demo-supervisor-uuid',
    submittedAt: new Date('2026-06-10T14:30:00Z'),
    createdAt: new Date('2026-06-10T14:00:00Z'),
    updatedAt: new Date('2026-06-10T14:30:00Z'),
    evidence: [
      {
        id: 'evi-3',
        submissionId: 'sub-vincom-3',
        imageUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&auto=format&fit=crop&q=80',
        thumbnailUrl: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=300&auto=format&fit=crop&q=80',
        cloudinaryPublicId: 'demo/posm',
        uploadedBy: 'demo-supervisor-uuid',
        createdAt: new Date('2026-06-10T14:20:00Z'),
      },
    ],
    history: [],
  },
];

export class SupabaseSubmissionRepository implements SubmissionRepository {
  private isSupabaseConfigured(): boolean {
    return Boolean(env.NEXT_PUBLIC_SUPABASE_URL && env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
  }

  async findById(id: string): Promise<Submission | null> {
    const found = inMemorySubmissions.find((s) => s.id === id);
    return found ? { ...found } : null;
  }

  async findByLocation(locationId: string): Promise<Submission[]> {
    return inMemorySubmissions.filter((s) => s.locationId === locationId);
  }

  async findByChecklistItem(locationId: string, checklistItemId: string): Promise<Submission | null> {
    const found = inMemorySubmissions.find(
      (s) => s.locationId === locationId && s.checklistItemId === checklistItemId
    );
    return found ? { ...found } : null;
  }

  async findPendingReviews(organizationId: string): Promise<Submission[]> {
    return inMemorySubmissions.filter((s) => s.status === SubmissionStatus.SUBMITTED);
  }

  async submit(params: {
    locationId: string;
    checklistItemId: string;
    notes?: string;
    submittedBy: string;
    photos: Array<{ imageUrl: string; thumbnailUrl?: string; cloudinaryPublicId: string }>;
  }): Promise<Submission> {
    const now = new Date();
    const existingIdx = inMemorySubmissions.findIndex(
      (s) => s.locationId === params.locationId && s.checklistItemId === params.checklistItemId
    );

    const newEvidence: Evidence[] = params.photos.map((p, idx) => ({
      id: `evi-${Date.now()}-${idx}`,
      submissionId: existingIdx !== -1 ? inMemorySubmissions[existingIdx].id : `sub-${Date.now()}`,
      imageUrl: p.imageUrl,
      thumbnailUrl: p.thumbnailUrl || p.imageUrl,
      cloudinaryPublicId: p.cloudinaryPublicId,
      uploadedBy: params.submittedBy,
      createdAt: now,
    }));

    if (existingIdx !== -1) {
      const existing = inMemorySubmissions[existingIdx];
      existing.status = SubmissionStatus.SUBMITTED;
      existing.notes = params.notes || existing.notes;
      existing.submittedBy = params.submittedBy;
      existing.submittedAt = now;
      existing.updatedAt = now;
      existing.evidence = [...(existing.evidence || []), ...newEvidence];
      return existing;
    }

    const newSub: Submission = {
      id: `sub-${Date.now()}`,
      locationId: params.locationId,
      checklistItemId: params.checklistItemId,
      status: SubmissionStatus.SUBMITTED,
      notes: params.notes,
      submittedBy: params.submittedBy,
      submittedAt: now,
      createdAt: now,
      updatedAt: now,
      evidence: newEvidence,
      history: [],
    };
    inMemorySubmissions.push(newSub);
    return newSub;
  }

  async review(params: {
    submissionId: string;
    reviewerId: string;
    action: ApprovalAction;
    notes?: string;
  }): Promise<void> {
    const now = new Date();
    const sub = inMemorySubmissions.find((s) => s.id === params.submissionId);
    if (!sub) return;

    if (params.action === ApprovalAction.APPROVE) {
      sub.status = SubmissionStatus.APPROVED;
    } else {
      sub.status = SubmissionStatus.NEEDS_REVISION;
    }
    sub.updatedAt = now;

    const newHistory: ApprovalHistory = {
      id: `hist-${Date.now()}`,
      submissionId: params.submissionId,
      reviewerId: params.reviewerId,
      action: params.action,
      notes: params.notes || null,
      createdAt: now,
    };

    if (!sub.history) sub.history = [];
    sub.history.unshift(newHistory);
  }
}
