import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapPersonnelWithAssignedBooths,
  computeTruthfulStaffingStats,
  CampaignPersonnelItem,
} from '../src/application/use-cases/campaigns/get-campaign-wizard-data';

describe('Campaign Wizard Personnel Mapping & Truthful KPIs', () => {
  test('mapPersonnelWithAssignedBooths: Gắn chính xác các booth phụ trách cho từng nhân sự (cả Active và Pending)', () => {
    const rawPersonnel = [
      {
        id: 'mem-1',
        memberId: 'mem-1',
        campaignId: 'camp-1',
        email: 'sup@eventgo.vn',
        fullName: 'Minh Thông',
        avatarUrl: null,
        role: 'SUPERVISOR' as const,
        status: 'ACTIVE' as const,
        isPending: false,
        createdAt: new Date(),
      },
      {
        id: 'invite_inv-1',
        inviteId: 'inv-1',
        campaignId: 'camp-1',
        email: 'app@eventgo.vn',
        fullName: 'app@eventgo.vn',
        avatarUrl: null,
        role: 'APPROVER' as const,
        status: 'PENDING' as const,
        isPending: true,
        createdAt: new Date(),
      },
    ];

    const allBooths = [
      {
        id: 'b-1',
        name: 'Gian hàng 01',
        code: 'B01',
        locationId: 'loc-1',
        locationName: 'Mixue Cây Xăng',
        supervisorMemberId: 'mem-1',
        approverMemberId: 'invite_inv-1',
      },
      {
        id: 'b-2',
        name: 'Gian hàng 02',
        code: 'B02',
        locationId: 'loc-1',
        locationName: 'Mixue Cây Xăng',
        supervisorMemberId: 'mem-1',
        approverMemberId: null,
      },
    ];

    const result = mapPersonnelWithAssignedBooths(rawPersonnel, allBooths);

    assert.equal(result.length, 2);

    // Minh Thông (mem-1) phụ trách 2 booth với vai trò SUPERVISOR
    const supUser = result.find((p) => p.id === 'mem-1');
    assert.ok(supUser);
    assert.equal(supUser.assignedBooths.length, 2);
    assert.equal(supUser.assignedBooths[0].boothId, 'b-1');
    assert.equal(supUser.assignedBooths[0].role, 'SUPERVISOR');
    assert.equal(supUser.assignedBooths[1].boothId, 'b-2');

    // app@eventgo.vn (invite_inv-1) phụ trách 1 booth với vai trò APPROVER
    const appUser = result.find((p) => p.id === 'invite_inv-1');
    assert.ok(appUser);
    assert.equal(appUser.assignedBooths.length, 1);
    assert.equal(appUser.assignedBooths[0].boothId, 'b-1');
    assert.equal(appUser.assignedBooths[0].role, 'APPROVER');
  });

  test('computeTruthfulStaffingStats: Tách bạch Đủ nhân sự sẵn sàng (Active) vs Nhân sự chờ kích hoạt (Pending)', () => {
    const booths = [
      // Booth 1: Cả 2 đều Active -> Sẵn sàng
      {
        id: 'b-1',
        hasSupervisor: true,
        hasApprover: true,
        isSupervisorPending: false,
        isApproverPending: false,
      },
      // Booth 2: Đủ 2 người nhưng có 1 người Pending -> Chờ kích hoạt
      {
        id: 'b-2',
        hasSupervisor: true,
        hasApprover: true,
        isSupervisorPending: false,
        isApproverPending: true,
      },
      // Booth 3: Thiếu người (chỉ có Supervisor) -> Chưa phân công đủ
      {
        id: 'b-3',
        hasSupervisor: true,
        hasApprover: false,
        isSupervisorPending: false,
        isApproverPending: false,
      },
    ];

    const stats = computeTruthfulStaffingStats(booths, 1);

    assert.equal(stats.totalBoothsCount, 3);
    assert.equal(stats.fullyStaffedActiveCount, 1); // Chỉ b-1
    assert.equal(stats.pendingStaffedCount, 1); // b-2
    assert.equal(stats.missingStaffCount, 1); // b-3
    assert.equal(stats.totalPendingInvitesCount, 1);
  });
});
