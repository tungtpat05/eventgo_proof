import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

describe('Campaign Date Validation Logic', () => {
  function validateCampaignDates(startDate: string, endDate: string): { valid: boolean; error?: string } {
    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      return { valid: false, error: 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.' };
    }
    return { valid: true };
  }

  test('Từ chối khi ngày kết thúc nhỏ hơn ngày bắt đầu', () => {
    const result = validateCampaignDates('2026-11-01', '2026-10-15');
    assert.equal(result.valid, false);
    assert.equal(result.error, 'Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
  });

  test('Chấp nhận khi ngày kết thúc lớn hơn ngày bắt đầu', () => {
    const result = validateCampaignDates('2026-10-01', '2026-10-31');
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });

  test('Chấp nhận khi ngày kết thúc trùng ngày bắt đầu (chiến dịch 1 ngày)', () => {
    const result = validateCampaignDates('2026-10-26', '2026-10-26');
    assert.equal(result.valid, true);
    assert.equal(result.error, undefined);
  });
});
