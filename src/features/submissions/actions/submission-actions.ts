'use server';

import { requireAssignedApprover, requireAssignedSupervisor } from '@/application/authorization/campaign-access';
import { ApprovalAction } from '@/domain/enums';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary-service';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { env } from '@/config/env';
import { revalidatePath } from 'next/cache';
import { formatActionError } from '@/lib/action-error';

export type SubmissionActionResult = {
  success: boolean;
  error?: string;
  errorCode?: string;
  params?: Record<string, string | number>;
  fieldErrors?: Record<string, string[]>;
};

export async function submitEvidenceAction(
  boothId: string,
  checklistItemId: string,
  notes: string,
  photosJson: string,
  campaignId?: string
): Promise<SubmissionActionResult> {
  try {
    await requireAssignedSupervisor(boothId);
    const photos = JSON.parse(photosJson) as Array<{ dataUrl?: string }>;
    if (!Array.isArray(photos) || photos.length === 0 || photos.some((photo) => !photo.dataUrl)) {
      return formatActionError('ERR_EVIDENCE_PHOTOS_REQUIRED', 'Vui lòng đính kèm ít nhất một hình ảnh bằng chứng nghiệm thu.');
    }
    if (!env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return formatActionError('ERR_CLOUDINARY_NOT_CONFIGURED', 'Cloudinary chưa được cấu hình. Không thể lưu evidence an toàn.');
    }

    const uploadedPhotos = [];
    for (const photo of photos) {
      const uploaded = await CloudinaryService.uploadImage(photo.dataUrl!, 'eventgo/evidence');
      if (!uploaded) throw new Error('Cloudinary không trả về thông tin ảnh đã tải lên.');
      uploadedPhotos.push({
        imageUrl: uploaded.secureUrl,
        thumbnailUrl: uploaded.thumbnailUrl,
        cloudinaryPublicId: uploaded.publicId,
      });
    }

    const repo = new SupabaseSubmissionRepository();
    await repo.submit({ boothId, checklistItemId, notes, photos: uploadedPhotos });

    if (campaignId) {
      revalidatePath(`/campaigns/supervision/${campaignId}`);
      revalidatePath(`/campaigns/${campaignId}`);
    }
    revalidatePath('/campaigns/supervision');
    revalidatePath('/campaigns/approvals');
    return { success: true };
  } catch (error: unknown) {
    return formatActionError(error, 'Lỗi khi nộp bằng chứng nghiệm thu.');
  }
}

export async function reviewSubmissionAction(
  submissionId: string,
  action: ApprovalAction,
  notes: string,
  campaignId?: string
): Promise<SubmissionActionResult> {
  try {
    await requireAssignedApprover(submissionId);
    if (action === ApprovalAction.REQUEST_REVISION && notes.trim().length === 0) {
      return formatActionError('ERR_REVISION_NOTES_REQUIRED', 'Bắt buộc phải nhập lý do khi yêu cầu chỉnh sửa.');
    }

    const repo = new SupabaseSubmissionRepository();
    await repo.review({ submissionId, action, notes });

    if (campaignId) {
      revalidatePath(`/campaigns/approvals/${campaignId}`);
      revalidatePath(`/campaigns/${campaignId}`);
    }
    revalidatePath('/campaigns/approvals');
    return { success: true };
  } catch (error: unknown) {
    return formatActionError(error, 'Lỗi khi ghi nhận kết quả duyệt.');
  }
}
