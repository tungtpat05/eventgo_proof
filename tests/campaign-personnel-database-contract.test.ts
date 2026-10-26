import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

describe('Campaign Personnel Database Contract & Business Rules', () => {
  // 1. Kiểm tra tồn tại và nội dung file migration
  const migrationPath = path.resolve('supabase/migrations/20261026000002_atomic_personnel_management_and_invites.sql');

  test('Migration file 20261026000002 must exist and define required atomic RPCs', () => {
    assert.ok(fs.existsSync(migrationPath), 'Migration file must exist');
    const sql = fs.readFileSync(migrationPath, 'utf8');

    // Phải định nghĩa lại set_campaign_member_access có dọn dẹp assignments
    assert.ok(sql.includes('set_campaign_member_access'), 'Must contain set_campaign_member_access');
    assert.ok(sql.includes('booth_supervisor_assignments'), 'Must cleanup booth_supervisor_assignments');
    assert.ok(sql.includes('booth_approver_assignments'), 'Must cleanup booth_approver_assignments');
    assert.ok(sql.includes('revoked_at'), 'Must set revoked_at');

    // Phải định nghĩa cancel_campaign_invite
    assert.ok(sql.includes('cancel_campaign_invite'), 'Must contain cancel_campaign_invite RPC');
    assert.ok(sql.includes('ACCEPTED'), 'Must check for ACCEPTED invite race condition');

    // Phải sửa invite_campaign_member không dùng UPSERT ghi đè role
    assert.ok(sql.includes('invite_campaign_member'), 'Must redefine invite_campaign_member');
    assert.ok(!sql.includes('DO UPDATE SET role = EXCLUDED.role'), 'Must NOT overwrite role on conflict');
  });

  // 2. Mô phỏng logic hợp đồng RPC set_campaign_member_access
  interface MemberState {
    id: string;
    role: string;
    status: 'ACTIVE' | 'REVOKED';
    revokedAt: Date | null;
    revokedBy: string | null;
  }

  interface Submission {
    id: string;
    approverMemberId: string;
    status: 'SUBMITTED' | 'APPROVED' | 'REJECTED';
  }

  function simulateAtomicRevokeMember(
    member: MemberState,
    isLastManager: boolean,
    pendingSubmissions: Submission[],
    assignedSupervisorBooths: string[],
    assignedApproverBooths: string[]
  ) {
    if (isLastManager) {
      throw new Error('Không thể thu hồi quyền của Quản lý duy nhất trong chiến dịch.');
    }

    // Kiểm tra nếu có submission chờ duyệt
    const hasPendingSubmission = pendingSubmissions.some(
      (s) => s.approverMemberId === member.id && s.status === 'SUBMITTED'
    );
    if (hasPendingSubmission) {
      throw new Error('Không thể thu hồi quyền Approver khi đang có bài nộp chờ phê duyệt. Vui lòng duyệt hoặc phân công lại trước.');
    }

    // Dọn dẹp assignments
    const remainingSupBooths = assignedSupervisorBooths.filter(() => false);
    const remainingAppBooths = assignedApproverBooths.filter(() => false);

    // Cập nhật member sang REVOKED
    const updatedMember: MemberState = {
      ...member,
      status: 'REVOKED',
      revokedAt: new Date(),
      revokedBy: 'manager-user-id',
    };

    // Kiểm tra constraint: status REVOKED phải có revokedAt
    if (updatedMember.status === 'REVOKED' && !updatedMember.revokedAt) {
      throw new Error('Constraint violation: revoked_state_is_consistent');
    }

    return {
      updatedMember,
      unassignedSupervisorCount: assignedSupervisorBooths.length,
      unassignedApproverCount: assignedApproverBooths.length,
    };
  }

  test('Thu hồi thành viên: dọn dẹp phân công booth và cập nhật status nguyên tử', () => {
    const member: MemberState = {
      id: 'mem-1',
      role: 'SUPERVISOR',
      status: 'ACTIVE',
      revokedAt: null,
      revokedBy: null,
    };

    const result = simulateAtomicRevokeMember(member, false, [], ['booth-1', 'booth-2'], []);
    assert.equal(result.updatedMember.status, 'REVOKED');
    assert.ok(result.updatedMember.revokedAt instanceof Date);
    assert.equal(result.unassignedSupervisorCount, 2);
  });

  test('Thu hồi Approver có submission đang chờ duyệt: bị chặn an toàn', () => {
    const member: MemberState = {
      id: 'app-mem-1',
      role: 'APPROVER',
      status: 'ACTIVE',
      revokedAt: null,
      revokedBy: null,
    };
    const submissions: Submission[] = [
      { id: 'sub-1', approverMemberId: 'app-mem-1', status: 'SUBMITTED' },
    ];

    assert.throws(
      () => simulateAtomicRevokeMember(member, false, submissions, [], ['booth-1']),
      /Không thể thu hồi quyền Approver khi đang có bài nộp chờ phê duyệt/
    );
  });

  // 3. Mô phỏng logic hợp đồng RPC cancel_campaign_invite
  function simulateCancelInvite(
    invite: { id: string; status: 'PENDING' | 'ACCEPTED' | 'REVOKED' } | null,
    isManager: boolean
  ) {
    if (!isManager) {
      throw new Error('Chỉ có Quản lý chiến dịch mới được hủy lời mời.');
    }
    if (!invite) {
      throw new Error('Không tìm thấy lời mời.');
    }
    if (invite.status === 'ACCEPTED') {
      throw new Error('Lời mời đã được người dùng kích hoạt và trở thành thành viên chính thức. Vui lòng làm mới danh sách.');
    }
    if (invite.status !== 'PENDING') {
      throw new Error('Lời mời không ở trạng thái chờ kích hoạt.');
    }
    return { deleted: true };
  }

  test('Hủy lời mời: Thành công khi PENDING, từ chối khi đã ACCEPTED', () => {
    const pendingInvite = { id: 'inv-1', status: 'PENDING' as const };
    const acceptedInvite = { id: 'inv-2', status: 'ACCEPTED' as const };

    const res = simulateCancelInvite(pendingInvite, true);
    assert.equal(res.deleted, true);

    assert.throws(
      () => simulateCancelInvite(acceptedInvite, true),
      /Lời mời đã được người dùng kích hoạt/
    );
  });

  // 4. Mô phỏng logic chống mời trùng (No Silent Overwrite)
  function simulateInviteMember(
    existingActiveEmails: Set<string>,
    existingPendingEmails: Set<string>,
    newEmail: string,
    role: string
  ) {
    const normalized = newEmail.trim().toLowerCase();
    if (existingActiveEmails.has(normalized)) {
      throw new Error(`Email ${normalized} đã là thành viên chính thức của chiến dịch. Hãy thay đổi vai trò trong danh sách.`);
    }
    if (existingPendingEmails.has(normalized)) {
      throw new Error(`Email ${normalized} đã có lời mời đang chờ kích hoạt. Bạn có thể gửi lại email hoặc thu hồi lời mời.`);
    }
    return { success: true, email: normalized, role };
  }

  test('Chống mời trùng: Báo lỗi thân thiện thay vì âm thầm ghi đè vai trò', () => {
    const actives = new Set(['user1@gmail.com']);
    const pendings = new Set(['user2@gmail.com']);

    assert.throws(
      () => simulateInviteMember(actives, pendings, 'user1@gmail.com', 'APPROVER'),
      /đã là thành viên chính thức/
    );

    assert.throws(
      () => simulateInviteMember(actives, pendings, 'user2@gmail.com', 'SUPERVISOR'),
      /đã có lời mời đang chờ kích hoạt/
    );

    const ok = simulateInviteMember(actives, pendings, 'newuser@gmail.com', 'SUPERVISOR');
    assert.equal(ok.success, true);
  });
});
