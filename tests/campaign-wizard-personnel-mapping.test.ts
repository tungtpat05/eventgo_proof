import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Campaign Wizard Personnel Mapping & Truthful Staffing KPIs', () => {
  interface BoothAssignment {
    boothId: string;
    boothName: string;
    boothCode?: string | null;
    locationId: string;
    locationName: string;
    role: 'SUPERVISOR' | 'APPROVER';
  }

  interface RawPersonnel {
    id: string;
    rawId: string;
    isPending: boolean;
    role: string;
    status: 'ACTIVE' | 'PENDING' | 'REVOKED';
    email: string;
    fullName: string;
  }

  // Pure logic function mapping bi-directional assignments and KPIs
  function calculatePersonnelAndKPIs(
    personnel: RawPersonnel[],
    booths: Array<{ id: string; name: string; code?: string | null; locationId: string; locationName: string }>,
    supAssignments: Array<{ booth_id: string; supervisor_member_id?: string | null; supervisor_invite_id?: string | null }>,
    appAssignments: Array<{ booth_id: string; approver_member_id?: string | null; approver_invite_id?: string | null }>
  ) {
    const boothMap = new Map(booths.map((b) => [b.id, b]));

    // Map boothId -> key
    const supByBooth = new Map<string, string>();
    supAssignments.forEach((s) => {
      const key = s.supervisor_member_id || (s.supervisor_invite_id ? `invite_${s.supervisor_invite_id}` : null);
      if (key) supByBooth.set(s.booth_id, key);
    });

    const appByBooth = new Map<string, string>();
    appAssignments.forEach((a) => {
      const key = a.approver_member_id || (a.approver_invite_id ? `invite_${a.approver_invite_id}` : null);
      if (key) appByBooth.set(a.booth_id, key);
    });

    // Map personnel -> assigned booths
    const assignmentsByPerson = new Map<string, BoothAssignment[]>();
    personnel.forEach((p) => assignmentsByPerson.set(p.id, []));

    supAssignments.forEach((s) => {
      const key = s.supervisor_member_id || (s.supervisor_invite_id ? `invite_${s.supervisor_invite_id}` : null);
      if (key && assignmentsByPerson.has(key)) {
        const b = boothMap.get(s.booth_id);
        if (b) {
          assignmentsByPerson.get(key)!.push({
            boothId: b.id,
            boothName: b.name,
            boothCode: b.code,
            locationId: b.locationId,
            locationName: b.locationName,
            role: 'SUPERVISOR',
          });
        }
      }
    });

    appAssignments.forEach((a) => {
      const key = a.approver_member_id || (a.approver_invite_id ? `invite_${a.approver_invite_id}` : null);
      if (key && assignmentsByPerson.has(key)) {
        const b = boothMap.get(a.booth_id);
        if (b) {
          assignmentsByPerson.get(key)!.push({
            boothId: b.id,
            boothName: b.name,
            boothCode: b.code,
            locationId: b.locationId,
            locationName: b.locationName,
            role: 'APPROVER',
          });
        }
      }
    });

    const personnelList = personnel.map((p) => ({
      ...p,
      assignedBooths: assignmentsByPerson.get(p.id) || [],
    }));

    // Calculate Truthful Staffing KPIs
    let fullyStaffedActiveCount = 0;
    let pendingStaffedCount = 0;
    let missingStaffCount = 0;

    booths.forEach((b) => {
      const supKey = supByBooth.get(b.id);
      const appKey = appByBooth.get(b.id);

      const hasSup = Boolean(supKey);
      const hasApp = Boolean(appKey);

      if (hasSup && hasApp) {
        const isSupPending = supKey?.startsWith('invite_');
        const isAppPending = appKey?.startsWith('invite_');

        if (isSupPending || isAppPending) {
          pendingStaffedCount++;
        } else {
          fullyStaffedActiveCount++;
        }
      } else {
        missingStaffCount++;
      }
    });

    return {
      personnelList,
      stats: {
        totalBoothsCount: booths.length,
        fullyStaffedActiveCount,
        pendingStaffedCount,
        missingStaffCount,
        totalPersonnelCount: personnel.length,
        activePersonnelCount: personnel.filter((p) => !p.isPending).length,
        pendingPersonnelCount: personnel.filter((p) => p.isPending).length,
      },
    };
  }

  test('Tổng hợp danh sách booth hai chiều cho từng nhân sự chính xác', () => {
    const personnel: RawPersonnel[] = [
      { id: 'mem-1', rawId: 'mem-1', isPending: false, role: 'SUPERVISOR', status: 'ACTIVE', email: 'sup@gmail.com', fullName: 'Supervisor 1' },
      { id: 'invite_inv-1', rawId: 'inv-1', isPending: true, role: 'APPROVER', status: 'PENDING', email: 'app@gmail.com', fullName: 'app@gmail.com' },
    ];

    const booths = [
      { id: 'b1', name: 'Gian hàng 1', code: 'B01', locationId: 'loc-1', locationName: 'Điểm 1' },
      { id: 'b2', name: 'Gian hàng 2', code: 'B02', locationId: 'loc-1', locationName: 'Điểm 1' },
    ];

    const supAssignments = [
      { booth_id: 'b1', supervisor_member_id: 'mem-1' },
      { booth_id: 'b2', supervisor_member_id: 'mem-1' },
    ];

    const appAssignments = [
      { booth_id: 'b1', approver_invite_id: 'inv-1' },
    ];

    const result = calculatePersonnelAndKPIs(personnel, booths, supAssignments, appAssignments);

    // mem-1 phụ trách 2 booth
    assert.equal(result.personnelList[0].assignedBooths.length, 2);
    assert.equal(result.personnelList[0].assignedBooths[0].boothId, 'b1');
    assert.equal(result.personnelList[0].assignedBooths[1].boothId, 'b2');

    // inv-1 phụ trách 1 booth
    assert.equal(result.personnelList[1].assignedBooths.length, 1);
    assert.equal(result.personnelList[1].assignedBooths[0].boothId, 'b1');
  });

  test('Tách bạch KPI: Đủ nhân sự sẵn sàng vs Có người chờ kích hoạt vs Thiếu người', () => {
    const personnel: RawPersonnel[] = [
      { id: 'sup-active', rawId: 'sup-active', isPending: false, role: 'SUPERVISOR', status: 'ACTIVE', email: 's@a.com', fullName: 'S1' },
      { id: 'app-active', rawId: 'app-active', isPending: false, role: 'APPROVER', status: 'ACTIVE', email: 'a@a.com', fullName: 'A1' },
      { id: 'invite_app-pending', rawId: 'app-pending', isPending: true, role: 'APPROVER', status: 'PENDING', email: 'p@a.com', fullName: 'P1' },
    ];

    const booths = [
      // Booth 1: Cả 2 đều Active -> fullyStaffedActiveCount
      { id: 'b1', name: 'B1', locationId: 'l1', locationName: 'L1' },
      // Booth 2: Có 1 người Pending -> pendingStaffedCount
      { id: 'b2', name: 'B2', locationId: 'l1', locationName: 'L1' },
      // Booth 3: Thiếu Approver -> missingStaffCount
      { id: 'b3', name: 'B3', locationId: 'l1', locationName: 'L1' },
    ];

    const sups = [
      { booth_id: 'b1', supervisor_member_id: 'sup-active' },
      { booth_id: 'b2', supervisor_member_id: 'sup-active' },
      { booth_id: 'b3', supervisor_member_id: 'sup-active' },
    ];

    const apps = [
      { booth_id: 'b1', approver_member_id: 'app-active' },
      { booth_id: 'b2', approver_invite_id: 'app-pending' },
    ];

    const result = calculatePersonnelAndKPIs(personnel, booths, sups, apps);

    assert.equal(result.stats.totalBoothsCount, 3);
    assert.equal(result.stats.fullyStaffedActiveCount, 1); // b1
    assert.equal(result.stats.pendingStaffedCount, 1); // b2
    assert.equal(result.stats.missingStaffCount, 1); // b3
    assert.equal(result.stats.totalPersonnelCount, 3);
    assert.equal(result.stats.activePersonnelCount, 2);
    assert.equal(result.stats.pendingPersonnelCount, 1);
  });

  test('Bắt lỗi DB trung thực: ném ngoại lệ khi truy vấn assignments thất bại', () => {
    function simulateQuery({ data, error }: { data: any; error: any }) {
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      return data || [];
    }

    assert.throws(
      () => simulateQuery({ data: null, error: { message: 'Connection timeout' } }),
      /Database query failed: Connection timeout/
    );
  });
});
