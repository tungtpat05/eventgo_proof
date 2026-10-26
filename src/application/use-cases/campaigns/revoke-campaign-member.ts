import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { CampaignRole, CampaignMemberStatus } from '@/domain/enums';
import { createAdminSupabaseClient } from '@/infrastructure/supabase/server';

export interface ManagerMemberLike {
  id: string;
  role: string;
  status: string;
}

export interface AssignmentLike {
  boothId: string;
  boothName?: string;
  supervisorMemberId?: string | null;
  approverMemberId?: string | null;
}

/**
 * Kiểm tra xem có vi phạm quy tắc bảo vệ Quản lý (Manager) cuối cùng không.
 */
export function validateLastManagerProtection(
  targetMemberId: string,
  members: ManagerMemberLike[]
): { allowed: boolean; reason?: string } {
  const target = members.find((m) => m.id === targetMemberId);
  if (!target) {
    return { allowed: true };
  }

  if (target.role === CampaignRole.MANAGER && target.status === CampaignMemberStatus.ACTIVE) {
    const activeManagers = members.filter(
      (m) => m.role === CampaignRole.MANAGER && m.status === CampaignMemberStatus.ACTIVE
    );
    if (activeManagers.length <= 1) {
      return {
        allowed: false,
        reason: 'Không thể xóa Quản lý (Manager) duy nhất của chiến dịch. Hãy gán quyền Quản lý cho thành viên khác trước khi xóa.',
      };
    }
  }

  return { allowed: true };
}

/**
 * Đánh giá các gian hàng (Booths) sẽ bị ảnh hưởng (mất nhân sự phụ trách) khi thành viên bị xóa.
 */
export function evaluateRevokeMemberImpact(
  memberId: string,
  supAssignments: Array<{ boothId: string; supervisorMemberId?: string | null }>,
  appAssignments: Array<{ boothId: string; approverMemberId?: string | null }>
) {
  const supBooths = supAssignments
    .filter((s) => s.supervisorMemberId === memberId)
    .map((s) => s.boothId);
  const appBooths = appAssignments
    .filter((a) => a.approverMemberId === memberId)
    .map((a) => a.boothId);

  const affectedSet = new Set([...supBooths, ...appBooths]);

  return {
    totalAffectedBooths: affectedSet.size,
    affectedBoothIds: Array.from(affectedSet),
    asSupervisorCount: supBooths.length,
    asApproverCount: appBooths.length,
  };
}

export interface RevokeMemberResult {
  success: boolean;
  error?: string;
  unassignedBoothsCount?: number;
}

/**
 * Use-case authoritative trên server: Thu hồi quyền thành viên chiến dịch
 * và tự động dọn dẹp các phân công booth liên quan.
 */
export async function revokeCampaignMemberUseCase(
  campaignId: string,
  memberId: string
): Promise<RevokeMemberResult> {
  await requireCampaignManager(campaignId);

  const supabase = createAdminSupabaseClient();

  // 1. Kiểm tra thành viên và quy tắc Manager cuối cùng
  const { data: membersData, error: memErr } = await supabase
    .from('campaign_members')
    .select('id, role, status')
    .eq('campaign_id', campaignId);

  if (memErr || !membersData) {
    return { success: false, error: memErr?.message || 'Không thể kiểm tra danh sách thành viên.' };
  }

  const protection = validateLastManagerProtection(memberId, membersData);
  if (!protection.allowed) {
    return { success: false, error: protection.reason };
  }

  // 2. Tìm tất cả booth thuộc chiến dịch này để bảo vệ dữ liệu cross-tenant
  const { data: locs } = await supabase
    .from('locations')
    .select('id')
    .eq('campaign_id', campaignId);
  const locIds = (locs || []).map((l) => l.id);

  let boothIds: string[] = [];
  if (locIds.length > 0) {
    const { data: booths } = await supabase
      .from('booths')
      .select('id')
      .in('location_id', locIds);
    boothIds = (booths || []).map((b) => b.id);
  }

  let unassignedCount = 0;

  if (boothIds.length > 0) {
    // 3. Xóa các phân công booth của thành viên này trong chiến dịch
    const [{ data: deletedSups }, { data: deletedApps }] = await Promise.all([
      supabase
        .from('booth_supervisor_assignments')
        .delete()
        .eq('supervisor_member_id', memberId)
        .in('booth_id', boothIds)
        .select('booth_id'),
      supabase
        .from('booth_approver_assignments')
        .delete()
        .eq('approver_member_id', memberId)
        .in('booth_id', boothIds)
        .select('booth_id'),
    ]);

    const affectedBooths = new Set<string>();
    (deletedSups || []).forEach((s) => affectedBooths.add(s.booth_id));
    (deletedApps || []).forEach((a) => affectedBooths.add(a.booth_id));
    unassignedCount = affectedBooths.size;
  }

  // 4. Cập nhật trạng thái thành viên sang REVOKED
  const { error: updateErr } = await supabase
    .from('campaign_members')
    .update({
      status: CampaignMemberStatus.REVOKED as any,
      updated_at: new Date().toISOString(),
    })
    .eq('id', memberId)
    .eq('campaign_id', campaignId);

  if (updateErr) {
    return { success: false, error: updateErr.message };
  }

  return { success: true, unassignedBoothsCount: unassignedCount };
}
