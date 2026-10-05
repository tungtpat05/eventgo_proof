'use server';

import { requireAssignedApprover, requireAssignedSupervisor } from '@/application/authorization/campaign-access';
import { ApprovalAction } from '@/domain/enums';
import { CloudinaryService } from '@/infrastructure/cloudinary/cloudinary-service';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { env } from '@/config/env';
import { revalidatePath } from 'next/cache';

export async function submitEvidenceAction(
  locationId: string,
  checklistItemId: string,
  notes: string,
  photosJson: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAssignedSupervisor(locationId);
    const photos = JSON.parse(photosJson) as Array<{ dataUrl?: string }>;
    if (!Array.isArray(photos) || photos.length === 0 || photos.some((photo) => !photo.dataUrl)) {
      return { error: 'Vui lòng đính kèm ít nhất một hình ảnh bằng chứng nghiệm thu.' };
    }
    if (!env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || !env.CLOUDINARY_API_KEY || !env.CLOUDINARY_API_SECRET) {
      return { error: 'Cloudinary chưa được cấu hình. Không thể lưu evidence an toàn.' };
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
    await repo.submit({ locationId, checklistItemId, notes, photos: uploadedPhotos });
    revalidatePath(`/locations/${locationId}`);
    revalidatePath(`/locations/${locationId}/submit`);
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Lỗi khi nộp bằng chứng nghiệm thu.' };
  }
}

export async function reviewSubmissionAction(
  submissionId: string,
  action: ApprovalAction,
  notes: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireAssignedApprover(submissionId);
    if (action === ApprovalAction.REQUEST_REVISION && notes.trim().length === 0) {
      return { error: 'Bắt buộc phải nhập lý do khi yêu cầu chỉnh sửa.' };
    }

    const repo = new SupabaseSubmissionRepository();
    await repo.review({ submissionId, action, notes });
    revalidatePath('/approvals');
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : 'Lỗi khi ghi nhận kết quả duyệt.' };
  }
}
