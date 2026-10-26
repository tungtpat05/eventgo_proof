'use server';

import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { CampaignRole } from '@/domain/enums';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import { sendCampaignInviteEmail, isMailConfigured } from '@/infrastructure/services/email-service';
import { env } from '@/config/env';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { formatActionError } from '@/lib/action-error';

const inviteSchema = z.object({
  campaignId: z.string().uuid(),
  email: z.string().trim().toLowerCase().email('Email không hợp lệ.'),
  role: z.nativeEnum(CampaignRole),
});

export interface InviteActionResult {
  success?: string;
  error?: string;
  inviteLink?: string;
  emailSent?: boolean;
  emailError?: string | null;
}

/**
 * Server Action mời thành viên qua Form (tương thích useActionState)
 */
export async function inviteCampaignMemberAction(
  _previousState: InviteActionResult | null,
  formData: FormData
): Promise<InviteActionResult> {
  try {
    const input = inviteSchema.parse({
      campaignId: formData.get('campaignId'),
      email: formData.get('email'),
      role: formData.get('role'),
    });

    return await executeInviteMember({
      campaignId: input.campaignId,
      email: input.email,
      role: input.role,
    });
  } catch (error: unknown) {
    const formatted = formatActionError(error, 'Không thể thêm thành viên.');
    return { error: formatted.error };
  }
}

/**
 * Server Action gọi trực tiếp từ Modal hoặc Client Component
 */
export async function inviteMemberDirectAction(params: {
  campaignId: string;
  email: string;
  role: CampaignRole;
}): Promise<InviteActionResult> {
  try {
    const input = inviteSchema.parse({
      campaignId: params.campaignId,
      email: params.email,
      role: params.role,
    });

    return await executeInviteMember(input);
  } catch (error: unknown) {
    const formatted = formatActionError(error, 'Không thể thêm thành viên.');
    return { error: formatted.error };
  }
}

async function executeInviteMember(input: {
  campaignId: string;
  email: string;
  role: CampaignRole;
}): Promise<InviteActionResult> {
  await requireCampaignManager(input.campaignId);

  // 1. Lấy thông tin người mời & chiến dịch
  const [session, campaign] = await Promise.all([
    getCurrentUserSession(),
    getCampaignDetailsUseCase(input.campaignId),
  ]);

  if (!session?.user) {
    return { error: 'Yêu cầu đăng nhập.' };
  }
  const currentUser = session.user;

  if (!campaign) {
    return { error: 'Chiến dịch không tồn tại.' };
  }

  // 2. Ghi DB (nếu đã có profile -> ACTIVE, chưa có profile -> PENDING)
  const repo = new SupabaseCampaignMemberRepository();
  const result = await repo.invite(input.campaignId, input.email, input.role);

  // 3. Tạo link mời dự phòng (Fallback Link)
  const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/auth/invite?email=${encodeURIComponent(
    input.email
  )}&campaignId=${input.campaignId}&role=${input.role}&type=campaign`;

  // 4. Gửi Email thông báo (Non-blocking: nếu SMTP lỗi vẫn giữ lời mời trong DB và trả link)
  let emailSent = false;
  let emailError: string | null = null;

  try {
    if (isMailConfigured()) {
      await sendCampaignInviteEmail({
        to: input.email,
        inviterName: currentUser.fullName || currentUser.email || 'Quản lý chiến dịch',
        campaignTitle: campaign.title,
        brandName: campaign.brandName,
        role: input.role,
        inviteLink,
      });
      emailSent = true;
    } else {
      emailError = 'Chưa cấu hình SMTP_USER và SMTP_PASSWORD trong file .env.local';
    }
  } catch (mailErr: any) {
    console.error('Lỗi khi gửi email mời thành viên chiến dịch:', mailErr);
    emailError = mailErr.message || 'Không thể gửi email thông báo qua máy chủ Google SMTP.';
  }

  // 5. Revalidate cache các trang liên quan
  revalidatePath(`/campaigns/${input.campaignId}`);
  revalidatePath(`/campaigns/${input.campaignId}/members`);
  revalidatePath(`/campaigns/${input.campaignId}/wizard`);

  const successMsg =
    result === 'MEMBER_ADDED'
      ? emailSent
        ? `Đã thêm thành viên ${input.email} và gửi email thông báo.`
        : `Đã thêm thành viên ${input.email} (Email thông báo chưa gửi được).`
      : emailSent
      ? `Đã gửi email lời mời tham gia tới ${input.email}.`
      : `Đã tạo lời mời cho ${input.email}. Hãy sao chép liên kết bên dưới để gửi trực tiếp.`;

  return {
    success: successMsg,
    inviteLink,
    emailSent,
    emailError,
  };
}

/**
 * Gửi lại email lời mời cho thành viên đang chờ xác nhận
 */
export async function resendCampaignInviteEmailAction(
  campaignId: string,
  inviteId: string
): Promise<{ success: boolean; error?: string; inviteLink?: string }> {
  try {
    await requireCampaignManager(campaignId);

    const [session, campaign] = await Promise.all([
      getCurrentUserSession(),
      getCampaignDetailsUseCase(campaignId),
    ]);

    if (!session?.user) {
      return { success: false, error: 'Yêu cầu đăng nhập.' };
    }
    const currentUser = session.user;

    if (!campaign) {
      return { success: false, error: 'Chiến dịch không tồn tại.' };
    }

    const repo = new SupabaseCampaignMemberRepository();
    const invites = await repo.findInvitesByCampaign(campaignId);
    const invite = invites.find((i) => i.id === inviteId);

    if (!invite) {
      return { success: false, error: 'Không tìm thấy thông tin lời mời.' };
    }

    const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/auth/invite?email=${encodeURIComponent(
      invite.email
    )}&campaignId=${campaignId}&role=${invite.role}&type=campaign`;

    await sendCampaignInviteEmail({
      to: invite.email,
      inviterName: currentUser.fullName || currentUser.email || 'Quản lý chiến dịch',
      campaignTitle: campaign.title,
      brandName: campaign.brandName,
      role: invite.role,
      inviteLink,
    });

    return { success: true, inviteLink };
  } catch (error: any) {
    return { success: false, error: error.message || 'Lỗi khi gửi lại email.' };
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
    revalidatePath(`/campaigns/${campaignId}`);
    revalidatePath(`/campaigns/${campaignId}/wizard`);
    revalidatePath('/dashboard');
    return { success: true };
  } catch (error: unknown) {
    const formatted = formatActionError(error, 'Không thể cập nhật quyền thành viên.');
    return { error: formatted.error };
  }
}
