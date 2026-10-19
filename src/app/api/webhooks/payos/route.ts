import { NextRequest, NextResponse } from 'next/server';
import { verifyPayOSWebhookData } from '@/infrastructure/payos/payos-client';
import { SupabaseTransactionRepository } from '@/infrastructure/repositories/supabase-transaction-repository';
import { SupabaseSubscriptionRepository } from '@/infrastructure/repositories/supabase-subscription-repository';
import { TransactionStatus, SubscriptionStatus } from '@/domain/enums';

const txnRepo = new SupabaseTransactionRepository();
const subRepo = new SupabaseSubscriptionRepository();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Verify webhook signature
    let verifiedData;
    try {
      verifiedData = await verifyPayOSWebhookData(body);
    } catch (err: any) {
      console.error('PayOS Webhook Signature Verification Failed:', err);
      return NextResponse.json({ error: 'Chữ ký không hợp lệ' }, { status: 400 });
    }

    if (!verifiedData) {
      return NextResponse.json({ error: 'Thiếu dữ liệu webhook' }, { status: 400 });
    }

    const { orderCode, amount, code, desc } = verifiedData;

    // Check code from PayOS (code === '00' means success)
    if (code === '00') {
      // Find matching transaction
      const { transactions } = await txnRepo.getAll();
      const matchingTxn = transactions.find(
        (t) => t.gatewayTransactionId === orderCode.toString() || t.transactionCode.includes(orderCode.toString())
      );

      if (matchingTxn && matchingTxn.status !== TransactionStatus.SUCCESS) {
        // 1. Mark transaction as SUCCESS
        await txnRepo.updateStatus(matchingTxn.id, TransactionStatus.SUCCESS, {
          paidAt: new Date(),
          notes: `PayOS Webhook: ${desc || 'Thanh toán thành công'}`,
        });

        // 2. Cumulative subscription extension
        const currentSub = await subRepo.getByUserId(matchingTxn.userId);
        let newExpiresAt: Date;

        if (
          currentSub &&
          currentSub.plan === matchingTxn.plan &&
          currentSub.expiresAt &&
          currentSub.expiresAt > new Date()
        ) {
          newExpiresAt = new Date(currentSub.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        }

        // 3. Upsert subscription
        await subRepo.upsert({
          userId: matchingTxn.userId,
          plan: matchingTxn.plan,
          status: SubscriptionStatus.ACTIVE,
          expiresAt: newExpiresAt,
        });

        console.log(`[PayOS Webhook] Activated ${matchingTxn.plan} for user ${matchingTxn.userId}`);
      }
    }

    return NextResponse.json({ success: true, message: 'Webhook đã xử lý thành công' });
  } catch (error: any) {
    console.error('PayOS Webhook Handler Error:', error);
    return NextResponse.json({ error: error.message || 'Lỗi xử lý webhook' }, { status: 500 });
  }
}
