'use server';

import { createLocationUseCase } from '@/application/use-cases/locations/create-location';
import { bulkImportLocationsUseCase } from '@/application/use-cases/locations/bulk-import-locations';
import { ExcelImportService } from '@/infrastructure/excel/excel-import-service';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface LocationActionState {
  error?: string;
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
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err;
    }
    const message = err instanceof Error ? err.message : 'Lỗi khi tạo địa điểm.';
    return { error: message };
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
    const message = err instanceof Error ? err.message : 'Lỗi khi lưu dữ liệu import.';
    return { error: message };
  }
}

export async function assignPersonnelAction(
  locationId: string,
  supervisorId: string | null,
  approverId: string | null,
  deadlineStr: string | null
): Promise<{ success: boolean; error?: string }> {
  try {
    const repo = new SupabaseLocationRepository();
    const deadline = deadlineStr ? new Date(deadlineStr) : null;
    await repo.assignPersonnel(locationId, supervisorId, approverId, deadline);
    revalidatePath(`/locations/${locationId}`);
    revalidatePath('/locations');
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Lỗi khi cập nhật phân công nhân sự.';
    return { success: false, error: message };
  }
}
