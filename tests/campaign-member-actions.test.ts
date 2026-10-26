import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Campaign Member Server Actions Error Mapping & Interfaces', () => {
  // Mô phỏng logic map lỗi từ RPC invite_campaign_member sang thông điệp người dùng
  function mapInviteActionError(dbErrorMessage: string): string {
    if (dbErrorMessage.includes('đã là thành viên chính thức')) {
      return dbErrorMessage;
    }
    if (dbErrorMessage.includes('đã có lời mời đang chờ kích hoạt')) {
      return dbErrorMessage;
    }
    if (dbErrorMessage.includes('Chỉ có Quản lý')) {
      return 'Bạn không có quyền quản lý chiến dịch này.';
    }
    return dbErrorMessage || 'Không thể gửi lời mời tham gia.';
  }

  test('Ánh xạ chính xác thông báo lỗi khi mời trùng email đã active', () => {
    const errorMsg = 'Email này đã là thành viên chính thức của chiến dịch với vai trò SUPERVISOR. Hãy thay đổi vai trò trong danh sách.';
    const result = mapInviteActionError(errorMsg);
    assert.equal(result, errorMsg);
  });

  test('Ánh xạ chính xác thông báo lỗi khi mời trùng email đã có pending invite', () => {
    const errorMsg = 'Email này đã có lời mời đang chờ kích hoạt với vai trò APPROVER. Bạn có thể gửi lại email hoặc thu hồi lời mời.';
    const result = mapInviteActionError(errorMsg);
    assert.equal(result, errorMsg);
  });

  test('Ánh xạ lỗi phân quyền', () => {
    const result = mapInviteActionError('Chỉ có Quản lý chiến dịch mới có quyền');
    assert.equal(result, 'Bạn không có quyền quản lý chiến dịch này.');
  });
});
