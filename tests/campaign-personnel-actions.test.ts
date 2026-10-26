import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateRevokeMemberImpact,
  validateLastManagerProtection,
} from '../src/application/use-cases/campaigns/revoke-campaign-member';

describe('Campaign Personnel Revocation & Cleanup Logic', () => {
  test('Bảo vệ Manager cuối cùng: Từ chối xóa khi chiến dịch chỉ còn 1 Manager duy nhất', () => {
    const managers = [{ id: 'mgr-1', role: 'MANAGER', status: 'ACTIVE' }];
    const canRevoke = validateLastManagerProtection('mgr-1', managers);
    assert.equal(canRevoke.allowed, false);
    assert.match(canRevoke.reason || '', /duy nhất/i);
  });

  test('Bảo vệ Manager cuối cùng: Cho phép xóa khi chiến dịch còn Manager khác', () => {
    const managers = [
      { id: 'mgr-1', role: 'MANAGER', status: 'ACTIVE' },
      { id: 'mgr-2', role: 'MANAGER', status: 'ACTIVE' },
    ];
    const canRevoke = validateLastManagerProtection('mgr-1', managers);
    assert.equal(canRevoke.allowed, true);
  });

  test('Xác định chính xác số lượng booth và danh sách booth bị ảnh hưởng khi thu hồi nhân sự', () => {
    const supervisorAssignments = [
      { boothId: 'b-1', boothName: 'Booth 1', supervisorMemberId: 'member-1' },
      { boothId: 'b-2', boothName: 'Booth 2', supervisorMemberId: 'member-2' },
    ];
    const approverAssignments = [
      { boothId: 'b-1', boothName: 'Booth 1', approverMemberId: 'member-3' },
      { boothId: 'b-2', boothName: 'Booth 2', approverMemberId: 'member-1' },
      { boothId: 'b-3', boothName: 'Booth 3', approverMemberId: 'member-1' },
    ];

    const impact = evaluateRevokeMemberImpact('member-1', supervisorAssignments, approverAssignments);

    assert.equal(impact.totalAffectedBooths, 3); // b-1 (sup), b-2 (app), b-3 (app)
    assert.deepEqual(impact.affectedBoothIds.sort(), ['b-1', 'b-2', 'b-3']);
    assert.equal(impact.asSupervisorCount, 1);
    assert.equal(impact.asApproverCount, 2);
  });
});
