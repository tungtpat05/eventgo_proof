'use server';

import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { SupabaseSubscriptionRepository } from '@/infrastructure/repositories/supabase-subscription-repository';
import { SupabaseTransactionRepository } from '@/infrastructure/repositories/supabase-transaction-repository';
import { createPayOSPaymentLink } from '@/infrastructure/payos/payos-client';
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
  const user = session.user;
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
      notes: 'Demo mode transaction',
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
  };
}

export async function simulatePaymentSuccessAction(transactionCode: string) {
  const session = await getCurrentUserSession();
  const currentUserId = session.user.id;
  const txn = await txnRepo.getByCode(transactionCode).catch(() => null);

  const targetPlan = txn?.plan || (transactionCode.includes('PRO')
    ? SubscriptionPlanTier.PRO
    : transactionCode.includes('STARTER')
    ? SubscriptionPlanTier.STARTER
    : SubscriptionPlanTier.FREE);

  const targetUserId = txn?.userId || currentUserId;

  if (txn && txn.status === TransactionStatus.SUCCESS) {
    return { success: true, message: 'Giao dịch đã được kích hoạt trước đó.' };
  }

  // 1. Mark transaction as SUCCESS if exists in DB
  if (txn) {
    await txnRepo.updateStatus(txn.id, TransactionStatus.SUCCESS, {
      paidAt: new Date(),
      notes: 'Thanh toán thành công (Simulated Sandbox)',
    }).catch(() => {});
  }

  // 2. Fetch current subscription to handle cumulative extension
  const currentSub = await subRepo.getByUserId(targetUserId).catch(() => null);
  let newExpiresAt: Date;

  if (
    currentSub &&
    currentSub.plan === targetPlan &&
    currentSub.expiresAt &&
    currentSub.expiresAt > new Date()
  ) {
    // Cumulative extension: extend 30 days from existing expiry date
    newExpiresAt = new Date(currentSub.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    // Fresh 30 days from now
    newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  // 3. Upsert subscription
  await subRepo.upsert({
    userId: targetUserId,
    plan: targetPlan,
    status: SubscriptionStatus.ACTIVE,
    expiresAt: newExpiresAt,
  }).catch((err) => {
    console.warn('Could not upsert subscription to DB (migration pending):', err.message);
  });

  revalidatePath('/settings/billing');
  revalidatePath('/campaigns');
  revalidatePath('/admin');

  return {
    success: true,
    message: `Đã kích hoạt thành công ${PLAN_CONFIGS[targetPlan].name} đến ${newExpiresAt.toLocaleDateString('vi-VN')}!`,
  };
}

export async function getUserTransactionsAction() {
  const session = await getCurrentUserSession();
  return txnRepo.getByUserId(session.user.id);
}
