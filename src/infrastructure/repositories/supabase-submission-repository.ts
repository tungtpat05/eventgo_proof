import { ApprovalHistory, Evidence, Submission } from '@/domain/entities';
import { CampaignMemberStatus, CampaignRole, SubmissionStatus } from '@/domain/enums';
import { SubmissionRepository } from '@/domain/repositories/submission-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Database, Json } from '@/types/database.types';

type SubmissionRow = Database['public']['Tables']['submissions']['Row'];
type EvidenceRow = Database['public']['Tables']['evidence']['Row'];
type HistoryRow = Database['public']['Tables']['approval_history']['Row'];

function mapEvidence(row: EvidenceRow): Evidence {
  return {
    id: row.id,
    submissionId: row.submission_id,
    imageUrl: row.image_url,
    thumbnailUrl: row.thumbnail_url,
    cloudinaryPublicId: row.cloudinary_public_id,
    fileSizeBytes: row.file_size_bytes,
    width: row.width,
    height: row.height,
    uploadedBy: row.uploaded_by,
    createdAt: new Date(row.created_at),
  };
}

function mapHistory(row: HistoryRow): ApprovalHistory {
  return {
    id: row.id,
    submissionId: row.submission_id,
    reviewerId: row.reviewer_id,
    action: row.action,
    notes: row.notes,
    createdAt: new Date(row.created_at),
  };
}

function mapSubmission(row: SubmissionRow, evidence: Evidence[] = [], history: ApprovalHistory[] = []): Submission {
  return {
    id: row.id,
    boothId: row.booth_id,
    checklistItemId: row.checklist_item_id,
    assignedApproverMemberId: row.assigned_approver_member_id,
    status: row.status,
    notes: row.notes,
    submittedBy: row.submitted_by,
    submittedAt: row.submitted_at ? new Date(row.submitted_at) : null,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    evidence,
    history,
  };
}

export class SupabaseSubmissionRepository implements SubmissionRepository {
  private async hydrate(rows: SubmissionRow[]): Promise<Submission[]> {
    if (rows.length === 0) return [];
    const supabase = await createServerSupabaseClient();
    const ids = rows.map((row) => row.id);
    const [{ data: evidence, error: evidenceError }, { data: history, error: historyError }] = await Promise.all([
      supabase.from('evidence').select('*').in('submission_id', ids).order('created_at'),
      supabase.from('approval_history').select('*').in('submission_id', ids).order('created_at', { ascending: false }),
    ]);
    if (evidenceError) throw new Error(evidenceError.message);
    if (historyError) throw new Error(historyError.message);

    return rows.map((row) =>
      mapSubmission(
        row,
        (evidence || []).filter((item) => item.submission_id === row.id).map(mapEvidence),
        (history || []).filter((item) => item.submission_id === row.id).map(mapHistory)
      )
    );
  }

  async findById(id: string): Promise<Submission | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase.from('submissions').select('*').eq('id', id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return (await this.hydrate([data]))[0];
  }

  async findByBooth(boothId: string): Promise<Submission[]> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('booth_id', boothId)
      .order('created_at');
    if (error) throw new Error(error.message);
    return this.hydrate(data || []);
  }

  async findByChecklistItem(boothId: string, checklistItemId: string): Promise<Submission | null> {
    const supabase = await createServerSupabaseClient();
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .eq('booth_id', boothId)
      .eq('checklist_item_id', checklistItemId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) return null;
    return (await this.hydrate([data]))[0];
  }

  async findPendingReviews(userId: string): Promise<Submission[]> {
    const supabase = await createServerSupabaseClient();
    const { data: memberships, error: membershipError } = await supabase
      .from('campaign_members')
      .select('id')
      .eq('user_id', userId)
      .eq('role', CampaignRole.APPROVER)
      .eq('status', CampaignMemberStatus.ACTIVE);
    if (membershipError) throw new Error(membershipError.message);
    if (!memberships || memberships.length === 0) return [];

    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .in('assigned_approver_member_id', memberships.map((membership) => membership.id))
      .eq('status', SubmissionStatus.SUBMITTED)
      .order('submitted_at');
    if (error) throw new Error(error.message);
    return this.hydrate(data || []);
  }

  async submit(params: {
    boothId: string;
    checklistItemId: string;
    notes?: string;
    photos: Array<{ imageUrl: string; thumbnailUrl?: string; cloudinaryPublicId: string }>;
  }): Promise<Submission> {
    const supabase = await createServerSupabaseClient();
    const { data: submissionId, error } = await supabase.rpc('submit_evidence', {
      p_booth_id: params.boothId,
      p_checklist_item_id: params.checklistItemId,
      p_notes: params.notes || '',
      p_photos: params.photos as Json,
    });
    if (error) throw new Error(error.message);
    const submission = await this.findById(submissionId);
    if (!submission) throw new Error('Không thể tải submission vừa tạo.');
    return submission;
  }

  async review(params: {
    submissionId: string;
    action: Database['public']['Enums']['approval_action'];
    notes?: string;
  }): Promise<void> {
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('review_submission', {
      p_submission_id: params.submissionId,
      p_action: params.action,
      p_notes: params.notes || '',
    });
    if (error) throw new Error(error.message);
  }
}
