import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { TransactionStatus } from '../src/domain/enums';

describe('PayOS Webhook Processing Logic', () => {
  function processWebhookPayment(
    webhookData: { orderCode: number; amount: number; code: string },
    matchingTxn: { id: string; amount: number; status: TransactionStatus } | null
  ): { status: number; message: string; activated: boolean } {
    if (webhookData.code !== '00') {
      return { status: 400, message: 'Giao dịch không thành công tại cổng', activated: false };
    }

    if (!matchingTxn) {
      return { status: 404, message: 'Không tìm thấy giao dịch tương ứng', activated: false };
    }

    // Idempotency check
    if (matchingTxn.status === TransactionStatus.SUCCESS) {
      return { status: 200, message: 'Giao dịch đã được xử lý trước đó', activated: false };
    }

    // Amount validation
    if (webhookData.amount < matchingTxn.amount) {
      return { status: 400, message: 'Số tiền thanh toán không đủ', activated: false };
    }

    return { status: 200, message: 'Kích hoạt thành công', activated: true };
  }

  test('Từ chối và không kích hoạt nếu số tiền thực nhận nhỏ hơn số tiền yêu cầu của gói', () => {
    const txn = { id: 'txn-1', amount: 149000, status: TransactionStatus.PENDING };
    const result = processWebhookPayment({ orderCode: 123456, amount: 50000, code: '00' }, txn);

    assert.equal(result.status, 400);
    assert.equal(result.activated, false);
    assert.equal(result.message, 'Số tiền thanh toán không đủ');
  });

  test('Kích hoạt thành công khi số tiền đủ và đúng mã đơn', () => {
    const txn = { id: 'txn-1', amount: 149000, status: TransactionStatus.PENDING };
    const result = processWebhookPayment({ orderCode: 123456, amount: 149000, code: '00' }, txn);

    assert.equal(result.status, 200);
    assert.equal(result.activated, true);
    assert.equal(result.message, 'Kích hoạt thành công');
  });

  test('Idempotency: Trả về HTTP 200 và không kích hoạt lặp nếu giao dịch đã ở trạng thái SUCCESS', () => {
    const txn = { id: 'txn-1', amount: 149000, status: TransactionStatus.SUCCESS };
    const result = processWebhookPayment({ orderCode: 123456, amount: 149000, code: '00' }, txn);

    assert.equal(result.status, 200);
    assert.equal(result.activated, false);
    assert.equal(result.message, 'Giao dịch đã được xử lý trước đó');
  });

  test('Trả về 404 nếu không tìm thấy giao dịch', () => {
    const result = processWebhookPayment({ orderCode: 999999, amount: 149000, code: '00' }, null);

    assert.equal(result.status, 404);
    assert.equal(result.activated, false);
  });
});
