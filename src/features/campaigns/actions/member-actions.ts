'use server';

import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { CampaignRole } from '@/domain/enums';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

const inviteSchema = z.object({
  campaignId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  role: z.nativeEnum(CampaignRole),
});

import { formatActionError } from '@/lib/action-error';

export async function inviteCampaignMemberAction(
  _previousState: { error?: string; success?: string } | null,
  formData: FormData
): Promise<{ error?: string; success?: string }> {
  try {
    const input = inviteSchema.parse({
      campaignId: formData.get('campaignId'),
      email: formData.get('email'),
      role: formData.get('role'),
    });
    await requireCampaignManager(input.campaignId);
    const result = await new SupabaseCampaignMemberRepository().invite(input.campaignId, input.email, input.role);
    revalidatePath(`/campaigns/${input.campaignId}/members`);
    return { success: result === 'MEMBER_ADDED' ? 'Đã thêm thành viên.' : 'Đã tạo lời mời chờ đăng nhập Google.' };
  } catch (error: unknown) {
    const formatted = formatActionError(error, 'Không thể thêm thành viên.');
    return { error: formatted.error };
  }
}

export async function updateCampaignMemberAction(
  campaignId: string,
  memberId: string,
  role: CampaignRole,
  revoke: boolean
): Promise<{ success?: boolean; error?: string }> {
  try {
    await requireCampaignManager(campaignId);
    await new SupabaseCampaignMemberRepository().setAccess(memberId, role, revoke);
    revalidatePath(`/campaigns/${campaignId}/members`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const formatted = formatActionError(error, 'Không thể cập nhật quyền thành viên.');
    return { error: formatted.error };
  }
}
