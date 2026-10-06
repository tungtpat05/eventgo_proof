'use server';

import {
  createBoothUseCase,
  updateBoothUseCase,
  deleteBoothUseCase,
  assignBoothPersonnelUseCase,
} from '@/application/use-cases/booths/manage-booth';
import {
  validateCampaignActivationUseCase,
  ActivationReadinessResult,
} from '@/application/use-cases/campaigns/validate-campaign-activation';
import { activateCampaignUseCase } from '@/application/use-cases/campaigns/activate-campaign';
import { formatActionError } from '@/lib/action-error';
import { revalidatePath } from 'next/cache';

export interface ActionResponse {
  success?: boolean;
  error?: string;
  fieldErrors?: Record<string, string[]>;
}

export async function createBoothAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const locationId = formData.get('locationId') as string;
  const campaignId = formData.get('campaignId') as string;
  const name = (formData.get('name') as string)?.trim();
  const code = (formData.get('code') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const deadlineStr = formData.get('deadline') as string;

  if (!name) {
    return { error: 'Tên gian hàng không được để trống' };
  }

  try {
    await createBoothUseCase({
      locationId,
      name,
      code,
      description,
      deadline: deadlineStr ? new Date(deadlineStr) : null,
    });

    if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath(`/locations/${locationId}`);
    return { success: true };
  } catch (err) {
    return formatActionError(err, 'Lỗi khi tạo gian hàng');
  }
}

export async function updateBoothAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const id = formData.get('id') as string;
  const campaignId = formData.get('campaignId') as string;
  const locationId = formData.get('locationId') as string;
  const name = (formData.get('name') as string)?.trim();
  const code = (formData.get('code') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const deadlineStr = formData.get('deadline') as string;

  if (!name) {
    return { error: 'Tên gian hàng không được để trống' };
  }

  try {
    await updateBoothUseCase({
      id,
      name,
      code,
      description,
      deadline: deadlineStr ? new Date(deadlineStr) : null,
    });

    if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
    if (locationId) revalidatePath(`/locations/${locationId}`);
    return { success: true };
  } catch (err) {
    return formatActionError(err, 'Lỗi khi cập nhật gian hàng');
  }
}

export async function deleteBoothAction(
  id: string,
  campaignId?: string,
  locationId?: string
): Promise<ActionResponse> {
  try {
    await deleteBoothUseCase(id);
    if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
    if (locationId) revalidatePath(`/locations/${locationId}`);
    return { success: true };
  } catch (err) {
    return formatActionError(err, 'Lỗi khi xóa gian hàng');
  }
}

export async function assignBoothPersonnelAction(
  prevState: ActionResponse | null,
  formData: FormData
): Promise<ActionResponse> {
  const boothId = formData.get('boothId') as string;
  const campaignId = formData.get('campaignId') as string;
  const supervisorMemberId = (formData.get('supervisorMemberId') as string) || null;
  const approverMemberId = (formData.get('approverMemberId') as string) || null;
  const deadlineStr = formData.get('deadline') as string;

  try {
    await assignBoothPersonnelUseCase({
      boothId,
      supervisorMemberId,
      approverMemberId,
      deadline: deadlineStr ? new Date(deadlineStr) : null,
    });

    if (campaignId) revalidatePath(`/campaigns/${campaignId}`);
    return { success: true };
  } catch (err) {
    return formatActionError(err, 'Lỗi khi phân công nhân sự');
  }
}

export async function checkCampaignActivationAction(
  campaignId: string
): Promise<ActivationReadinessResult> {
  try {
    return await validateCampaignActivationUseCase(campaignId);
  } catch (err) {
    return {
      canActivate: false,
      errors: [(err as Error).message || 'Không thể kiểm tra điều kiện kích hoạt.'],
    };
  }
}

export async function activateCampaignAction(
  campaignId: string
): Promise<ActionResponse> {
  try {
    await activateCampaignUseCase(campaignId);
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath('/campaigns');
    revalidatePath('/campaigns/managed');
    return { success: true };
  } catch (err) {
    return formatActionError(err, 'Lỗi khi kích hoạt chiến dịch');
  }
}
