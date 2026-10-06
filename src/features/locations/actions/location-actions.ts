'use server';

import { createLocationUseCase } from '@/application/use-cases/locations/create-location';
import { bulkImportLocationsUseCase } from '@/application/use-cases/locations/bulk-import-locations';
import { ExcelImportService } from '@/infrastructure/excel/excel-import-service';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { getLocationDetailsUseCase } from '@/application/use-cases/locations/get-location-details';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

import { formatActionError } from '@/lib/action-error';

export interface LocationActionState {
  error?: string;
  fieldErrors?: Record<string, string[]>;
  success?: boolean;
}

export async function createLocationAction(
  prevState: LocationActionState | null,
  formData: FormData
): Promise<LocationActionState> {
  const campaignId = formData.get('campaignId') as string;
  const name = formData.get('name') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const deadline = (formData.get('deadline') as string) || null;

  try {
    const loc = await createLocationUseCase({
      campaignId,
      name,
      address,
      city,
      deadline,
    });

    revalidatePath('/locations');
    revalidatePath(`/campaigns/${campaignId}`);
    redirect(`/locations/${loc.id}`);
  } catch (err: unknown) {
    return formatActionError(err, 'Lỗi khi tạo địa điểm.');
  }
}

export interface ImportPreviewState {
  error?: string;
  validCount?: number;
  errorCount?: number;
  previewRows?: Array<{ name: string; address: string; city: string }>;
  errorDetails?: Array<{ row: number; message: string }>;
}

export async function parseExcelFileAction(
  prevState: ImportPreviewState | null,
  formData: FormData
): Promise<ImportPreviewState> {
  const file = formData.get('file') as File | null;
  if (!file || file.size === 0) {
    return { error: 'Vui lòng chọn một file Excel (.xlsx) hoặc CSV hợp lệ.' };
  }

  try {
    await getCurrentUserSession();
    const buffer = await file.arrayBuffer();
    const result = ExcelImportService.parseLocations(buffer);

    return {
      validCount: result.validRows.length,
      errorCount: result.errors.length,
      previewRows: result.validRows.slice(0, 10), // Show first 10 for preview
      errorDetails: result.errors,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Không thể đọc file bảng tính.';
    return { error: message };
  }
}

export async function confirmImportAction(
  campaignId: string,
  rowsJson: string
): Promise<{ error?: string; success?: boolean; count?: number }> {
  try {
    const rows = JSON.parse(rowsJson);
    const result = await bulkImportLocationsUseCase(campaignId, rows);
    revalidatePath('/locations');
    revalidatePath(`/campaigns/${campaignId}`);
    return { success: true, count: result.count };
  } catch (err: unknown) {
    const formatted = formatActionError(err, 'Lỗi khi lưu dữ liệu import.');
    return { error: formatted.error };
  }
}

export async function assignPersonnelAction(
  locationId: string,
  _supervisorId: string | null,
  _approverId: string | null,
  deadlineStr: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const location = await getLocationDetailsUseCase(locationId);
    await requireCampaignManager(location.campaignId);
    const repo = new SupabaseLocationRepository();
    const deadline = deadlineStr ? new Date(deadlineStr) : null;
    await repo.save({
      id: locationId,
      campaignId: location.campaignId,
      name: location.name,
      address: location.address,
      city: location.city,
      deadline,
    });
    revalidatePath(`/locations/${locationId}`);
    revalidatePath('/locations');
    return { success: true };
  } catch (err: unknown) {
    const formatted = formatActionError(err, 'Lỗi khi cập nhật thông tin địa điểm.');
    return { success: false, error: formatted.error };
  }
}

export async function assignSubmissionApproverAction(
  campaignId: string,
  submissionId: string,
  approverMemberId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireCampaignManager(campaignId);
    const supabase = await createServerSupabaseClient();
    const { error } = await supabase.rpc('assign_submission_approver', {
      p_submission_id: submissionId,
      p_approver_member_id: approverMemberId,
    });
    if (error) throw new Error(error.message);
    revalidatePath(`/locations`);
    revalidatePath('/approvals');
    return { success: true };
  } catch (error: unknown) {
    const formatted = formatActionError(error, 'Không thể đổi Approver của submission.');
    return { error: formatted.error };
  }
}
