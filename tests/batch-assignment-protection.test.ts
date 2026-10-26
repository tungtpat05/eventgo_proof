import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Batch Assignment Role Protection Logic', () => {
  // Mô phỏng logic bảo toàn vai trò đối ứng trong batchAssignLocationPersonnelInWizardAction
  function resolveBatchAssignments(
    boothIds: string[],
    existingSups: Map<string, { memberId: string | null; inviteId: string | null }>,
    existingApps: Map<string, { memberId: string | null; inviteId: string | null }>,
    inputSupervisorId?: string | null,
    inputApproverId?: string | null
  ) {
    const assignments: Array<{
      boothId: string;
      finalSupervisor: string | null;
      finalApprover: string | null;
    }> = [];

    for (const boothId of boothIds) {
      const currentSup = existingSups.get(boothId);
      const currentApp = existingApps.get(boothId);

      const finalSupervisor =
        inputSupervisorId !== undefined && inputSupervisorId !== ''
          ? inputSupervisorId
          : currentSup
          ? currentSup.inviteId
            ? `invite_${currentSup.inviteId}`
            : currentSup.memberId
          : null;

      const finalApprover =
        inputApproverId !== undefined && inputApproverId !== ''
          ? inputApproverId
          : currentApp
          ? currentApp.inviteId
            ? `invite_${currentApp.inviteId}`
            : currentApp.memberId
          : null;

      assignments.push({ boothId, finalSupervisor, finalApprover });
    }

    return assignments;
  }

  test('Khi chỉ chọn Supervisor mới, giữ nguyên 100% Approver đã có của booth', () => {
    const boothIds = ['booth-1', 'booth-2'];
    const sups = new Map([
      ['booth-1', { memberId: 'sup-old-1', inviteId: null }],
      ['booth-2', { memberId: null, inviteId: 'inv-sup-2' }],
    ]);
    const apps = new Map([
      ['booth-1', { memberId: 'app-old-1', inviteId: null }],
      ['booth-2', { memberId: null, inviteId: 'inv-app-2' }],
    ]);

    const result = resolveBatchAssignments(boothIds, sups, apps, 'new-supervisor-id', undefined);

    assert.equal(result.length, 2);
    // Supervisor cập nhật theo giá trị mới
    assert.equal(result[0].finalSupervisor, 'new-supervisor-id');
    assert.equal(result[1].finalSupervisor, 'new-supervisor-id');
    // Approver được BẢO TOÀN, không bị xóa thành null
    assert.equal(result[0].finalApprover, 'app-old-1');
    assert.equal(result[1].finalApprover, 'invite_inv-app-2');
  });

  test('Khi chỉ chọn Approver mới, giữ nguyên 100% Supervisor đã có của booth', () => {
    const boothIds = ['booth-1'];
    const sups = new Map([
      ['booth-1', { memberId: 'sup-preserve-1', inviteId: null }],
    ]);
    const apps = new Map([
      ['booth-1', { memberId: 'app-old-1', inviteId: null }],
    ]);

    const result = resolveBatchAssignments(boothIds, sups, apps, undefined, 'new-approver-id');

    assert.equal(result[0].finalSupervisor, 'sup-preserve-1');
    assert.equal(result[0].finalApprover, 'new-approver-id');
  });
});
