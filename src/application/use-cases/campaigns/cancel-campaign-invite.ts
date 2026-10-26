import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { createAdminSupabaseClient } from '@/infrastructure/supabase/server';

export interface CancelInviteResult {
  success: boolean;
  error?: string;
  unassignedBoothsCount?: number;
}

/**
 * Thu hồi / Hủy lời mời tham gia chiến dịch (Pending Invite).
 * Tự động xóa cascading các phân công booth đang trỏ vào inviteId này.
 */
export async function cancelCampaignInviteUseCase(
  campaignId: string,
  inviteId: string
): Promise<CancelInviteResult> {
  await requireCampaignManager(campaignId);

  const supabase = createAdminSupabaseClient();

  // 1. Kiểm tra tồn tại lời mời thuộc chiến dịch
  const { data: invite, error: fetchErr } = await supabase
    .from('campaign_invites')
    .select('id, email, status')
    .eq('id', inviteId)
    .eq('campaign_id', campaignId)
    .maybeSingle();

  if (fetchErr || !invite) {
    return { success: false, error: fetchErr?.message || 'Không tìm thấy thông tin lời mời.' };
  }

  // 2. Tìm các booth đang liên kết với invite này để thống kê số booth bị ảnh hưởng
  const [{ data: supBooths }, { data: appBooths }] = await Promise.all([
    supabase
      .from('booth_supervisor_assignments')
      .select('booth_id')
      .eq('supervisor_invite_id', inviteId),
    supabase
      .from('booth_approver_assignments')
      .select('booth_id')
      .eq('approver_invite_id', inviteId),
  ]);

  const affectedBooths = new Set<string>();
  (supBooths || []).forEach((b) => affectedBooths.add(b.booth_id));
  (appBooths || []).forEach((b) => affectedBooths.add(b.booth_id));

  // 3. Xóa lời mời (Database FK ON DELETE CASCADE sẽ xóa cả assignment)
  // Để phòng hờ nếu FK không cascade, xóa thủ công trước
  if (affectedBooths.size > 0) {
    await Promise.all([
      supabase.from('booth_supervisor_assignments').delete().eq('supervisor_invite_id', inviteId),
      supabase.from('booth_approver_assignments').delete().eq('approver_invite_id', inviteId),
    ]);
  }

  const { error: delErr } = await supabase
    .from('campaign_invites')
    .delete()
    .eq('id', inviteId)
    .eq('campaign_id', campaignId);

  if (delErr) {
    return { success: false, error: delErr.message };
  }

  return { success: true, unassignedBoothsCount: affectedBooths.size };
}
