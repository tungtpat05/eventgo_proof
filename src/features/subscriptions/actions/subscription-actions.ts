'use server';

import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { SupabaseSubscriptionRepository } from '@/infrastructure/repositories/supabase-subscription-repository';
import { SupabaseTransactionRepository } from '@/infrastructure/repositories/supabase-transaction-repository';
import { createPayOSPaymentLink, getPayOSPaymentLinkInformation } from '@/infrastructure/payos/payos-client';
import {
  SubscriptionPlanTier,
  SubscriptionStatus,
  TransactionStatus,
  PaymentGatewayProvider,
  CampaignStatus,
} from '@/domain/enums';
import { PLAN_CONFIGS, PlanConfig, Subscription } from '@/domain/entities';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { revalidatePath } from 'next/cache';

const subRepo = new SupabaseSubscriptionRepository();
const txnRepo = new SupabaseTransactionRepository();

export interface UserSubscriptionSummary {
  subscription: Subscription | null;
  planConfig: PlanConfig;
  activeCampaignCount: number;
  remainingCampaignSlots: number;
  daysRemaining: number | null;
  isExpiringSoon: boolean;
  isExpired: boolean;
  canCreateCampaign: boolean;
}

export async function getSubscriptionPlanConfigsAction(): Promise<PlanConfig[]> {
  return subRepo.getPlanConfigs();
}

export async function getUserSubscriptionSummaryAction(): Promise<UserSubscriptionSummary> {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập để xem thông tin gói cước.');
  }
  const userId = session.user.id;

  const [sub, supabase] = await Promise.all([
    subRepo.getByUserId(userId),
    createServerSupabaseClient(),
  ]);

  // Count active campaigns created by this user
  const { count: activeCount } = await supabase
    .from('campaigns')
    .select('*', { count: 'exact', head: true })
    .eq('created_by', userId)
    .eq('status', CampaignStatus.ACTIVE);

  const planTier = sub?.plan || SubscriptionPlanTier.FREE;
  const planConfig = await subRepo.getPlanConfigByTier(planTier);
  const activeCampaignCount = activeCount || 0;
  const remainingCampaignSlots = Math.max(0, planConfig.maxActiveCampaigns - activeCampaignCount);

  let daysRemaining: number | null = null;
  let isExpiringSoon = false;
  let isExpired = false;

  if (sub?.expiresAt) {
    const diffMs = sub.expiresAt.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
    isExpiringSoon = daysRemaining <= 3 && daysRemaining > 0;
    isExpired = diffMs <= 0;
  }

  // Soft-lock rule: Can only create/activate new campaign if active count < plan quota
  const canCreateCampaign = activeCampaignCount < planConfig.maxActiveCampaigns;

  return {
    subscription: sub,
    planConfig,
    activeCampaignCount,
    remainingCampaignSlots,
    daysRemaining,
    isExpiringSoon,
    isExpired,
    canCreateCampaign,
  };
}

export async function createSubscriptionPaymentAction(targetPlan: SubscriptionPlanTier) {
  if (targetPlan === SubscriptionPlanTier.FREE) {
    throw new Error('Gói Free không yêu cầu thanh toán.');
  }

  const session = await getCurrentUserSession();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập trước khi tạo giao dịch thanh toán.');
  }
  const user = session.user;

  // Active downgrade guard: prevent accidental loss of a higher tier plan
  const currentSub = await subRepo.getByUserId(user.id);
  const PLAN_TIER_LEVEL: Record<SubscriptionPlanTier, number> = {
    [SubscriptionPlanTier.FREE]: 0,
    [SubscriptionPlanTier.STARTER]: 1,
    [SubscriptionPlanTier.PRO]: 2,
  };
  const isCurrentActive =
    currentSub &&
    currentSub.status === SubscriptionStatus.ACTIVE &&
    currentSub.plan !== SubscriptionPlanTier.FREE &&
    currentSub.expiresAt &&
    new Date(currentSub.expiresAt).getTime() > Date.now();

  if (isCurrentActive) {
    const currentLevel = PLAN_TIER_LEVEL[currentSub.plan] ?? 0;
    const targetLevel = PLAN_TIER_LEVEL[targetPlan] ?? 0;
    if (targetLevel < currentLevel) {
      throw new Error(
        `Bạn đang sử dụng gói ${PLAN_CONFIGS[currentSub.plan]?.name || currentSub.plan} còn thời hạn. Vui lòng đợi gói hiện tại hết hạn trước khi đăng ký gói thấp hơn.`
      );
    }
  }

  const planConfig = await subRepo.getPlanConfigByTier(targetPlan);

  // Generate unique order code (numeric for PayOS)
  const timestampPart = Date.now().toString().slice(-6);
  const randomPart = Math.floor(1000 + Math.random() * 9000).toString();
  const numericOrderCode = parseInt(`${timestampPart}${randomPart}`, 10);
  const transactionCode = `TXN_${targetPlan}_${numericOrderCode}`;

  const host = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const returnUrl = `${host}/settings/billing?status=success&code=${transactionCode}`;
  const cancelUrl = `${host}/settings/billing?status=cancelled&code=${transactionCode}`;

  const paymentLink = await createPayOSPaymentLink({
    orderCode: numericOrderCode,
    amount: planConfig.priceMonthlyVnd,
    description: `EventGo ${targetPlan}`,
    returnUrl,
    cancelUrl,
    buyerName: user.fullName,
    buyerEmail: user.email,
    items: [
      {
        name: `Nâng cấp ${planConfig.name} (30 ngày)`,
        quantity: 1,
        price: planConfig.priceMonthlyVnd,
      },
    ],
  });


  // Save transaction to DB with fallback
  let transaction: any;
  try {
    transaction = await txnRepo.create({
      transactionCode,
      userId: user.id,
      plan: targetPlan,
      amount: planConfig.priceMonthlyVnd,
      currency: 'VND',
      provider: PaymentGatewayProvider.PAYOS_VIETQR,
      paymentUrl: paymentLink.checkoutUrl,
      qrCodeUrl: paymentLink.qrCode,
      gatewayTransactionId: numericOrderCode.toString(),
    });
  } catch (err: any) {
    console.warn('Could not save transaction to DB (migration pending):', err.message);
    transaction = {
      id: `local-demo-${numericOrderCode}`,
      transactionCode,
      userId: user.id,
      plan: targetPlan,
      amount: planConfig.priceMonthlyVnd,
      currency: 'VND',
      provider: PaymentGatewayProvider.PAYOS_VIETQR,
      status: TransactionStatus.PENDING,
      paymentUrl: paymentLink.checkoutUrl,
      qrCodeUrl: paymentLink.qrCode,
      gatewayTransactionId: numericOrderCode.toString(),
      notes: 'PayOS VietQR transaction',
      paidAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  return {
    transaction,
    checkoutUrl: paymentLink.checkoutUrl,
    qrCode: paymentLink.qrCode,
    amount: planConfig.priceMonthlyVnd,
    orderCode: numericOrderCode,
    accountNumber: paymentLink.accountNumber,
    accountName: paymentLink.accountName,
    bin: paymentLink.bin,
    bankName: paymentLink.bankName,
    description: paymentLink.description,
  };
}

export async function checkSubscriptionPaymentStatusAction(
  orderCode: number,
  transactionCode: string
) {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    throw new Error('Yêu cầu đăng nhập.');
  }
  const currentUserId = session.user.id;

  // 1. Check in Database first (may have been updated by Webhook)
  const txn = await txnRepo.getByCode(transactionCode).catch(() => null);
  if (txn) {
    if (txn.userId !== currentUserId) {
      throw new Error('Bạn không có quyền kiểm tra trạng thái giao dịch này.');
    }
    if (txn.status === TransactionStatus.SUCCESS) {
      return {
        isPaid: true,
        status: 'PAID',
        message: 'Giao dịch đã hoàn tất và kích hoạt thành công!',
      };
    }
  }

  // 2. Query PayOS directly
  const payosInfo = await getPayOSPaymentLinkInformation(orderCode);
  if (!payosInfo) {
    return { isPaid: false, status: 'PENDING' };
  }

  if (payosInfo.status === 'PAID') {
    const targetPlan = txn?.plan || (transactionCode.includes('PRO')
      ? SubscriptionPlanTier.PRO
      : transactionCode.includes('STARTER')
      ? SubscriptionPlanTier.STARTER
      : SubscriptionPlanTier.FREE);

    const targetUserId = txn?.userId || currentUserId;

    // A. Update or Create transaction in DB
    if (txn) {
      await txnRepo.updateStatus(txn.id, TransactionStatus.SUCCESS, {
        paidAt: new Date(),
        notes: `PayOS VietQR: Đã chuyển khoản MB Bank thành công (Tự động đối soát)`,
      }).catch((err) => console.error('Failed to update txn status in DB:', err));
    } else {
      try {
        const createdTxn = await txnRepo.create({
          transactionCode,
          userId: targetUserId,
          plan: targetPlan,
          amount: payosInfo.amount || 2000,
          currency: 'VND',
          provider: PaymentGatewayProvider.PAYOS_VIETQR,
          gatewayTransactionId: orderCode.toString(),
          notes: 'PayOS VietQR: Đã chuyển khoản MB Bank thành công (Đối soát tự động)',
        });
        await txnRepo.updateStatus(createdTxn.id, TransactionStatus.SUCCESS, {
          paidAt: new Date(),
          notes: 'PayOS VietQR: Đã chuyển khoản MB Bank thành công (Đối soát tự động)',
        });
      } catch (err) {
        console.error('Failed to create fallback txn in DB:', err);
      }
    }

    // B. Calculate cumulative expiration (+30 days)
    const currentSub = await subRepo.getByUserId(targetUserId).catch(() => null);
    let newExpiresAt: Date;

    if (
      currentSub &&
      currentSub.plan === targetPlan &&
      currentSub.expiresAt &&
      currentSub.expiresAt > new Date()
    ) {
      newExpiresAt = new Date(currentSub.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
    } else {
      newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    }

    // C. Upsert subscription in DB
    await subRepo.upsert({
      userId: targetUserId,
      plan: targetPlan,
      status: SubscriptionStatus.ACTIVE,
      expiresAt: newExpiresAt,
    }).catch((err) => console.error('Failed to upsert subscription in DB:', err));

    revalidatePath('/settings/billing');
    revalidatePath('/campaigns');
    revalidatePath('/campaigns/managed');
    revalidatePath('/admin/dashboard');

    return {
      isPaid: true,
      status: 'PAID',
      message: `Đã kích hoạt thành công ${PLAN_CONFIGS[targetPlan].name} đến ${newExpiresAt.toLocaleDateString('vi-VN')}!`,
    };
  }

  if (payosInfo.status === 'CANCELLED' || payosInfo.status === 'EXPIRED') {
    return { isPaid: false, status: payosInfo.status };
  }

  return { isPaid: false, status: 'PENDING' };
}

export async function getUserTransactionsAction() {
  const session = await getCurrentUserSession();
  if (!session?.user) return [];
  return txnRepo.getByUserId(session.user.id);
}
