'use server';

import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { ApprovalAction, UserRole } from '@/domain/enums';
import { AuthorizationError, ValidationError } from '@/domain/errors';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function submitEvidenceAction(
  locationId: string,
  checklistItemId: string,
  notes: string,
  photosJson: string
) {
  const session = await getCurrentUserSession();
  const photos = JSON.parse(photosJson) as Array<{ dataUrl: string }>;

  if (!photos || photos.length === 0) {
    return { error: 'Vui lòng đính kèm ít nhất một hình ảnh bằng chứng nghiệm thu.' };
  }

  try {
    const repo = new SupabaseSubmissionRepository();
    await repo.submit({
      locationId,
      checklistItemId,
      notes,
      submittedBy: session.user.id,
      photos: photos.map((p, idx) => ({
        imageUrl: p.dataUrl,
        thumbnailUrl: p.dataUrl,
        cloudinaryPublicId: `evidence-${Date.now()}-${idx}`,
      })),
    });

    revalidatePath(`/locations/${locationId}`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi nộp bằng chứng nghiệm thu.';
    return { error: message };
  }
}

export async function reviewSubmissionAction(
  submissionId: string,
  action: ApprovalAction,
  notes: string
) {
  const session = await getCurrentUserSession();

  if (session.user.role !== UserRole.PROJECT_MANAGER && session.user.role !== UserRole.APPROVER) {
    throw new AuthorizationError('Chỉ Quản lý dự án hoặc Người duyệt mới có quyền phê duyệt.');
  }

  if (action === ApprovalAction.REQUEST_REVISION && (!notes || notes.trim().length === 0)) {
    return { error: 'Bắt buộc phải nhập lý do khi yêu cầu chỉnh sửa.' };
  }

  try {
    const repo = new SupabaseSubmissionRepository();
    await repo.review({
      submissionId,
      reviewerId: session.user.id,
      action,
      notes,
    });

    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi ghi nhận kết quả duyệt.';
    return { error: message };
  }
}
