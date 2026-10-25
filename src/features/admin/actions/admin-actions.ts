'use server';

import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { SupabaseSystemAdminRepository } from '@/infrastructure/repositories/supabase-system-admin-repository';
import { SupabaseSubscriptionRepository } from '@/infrastructure/repositories/supabase-subscription-repository';
import { SupabaseTransactionRepository } from '@/infrastructure/repositories/supabase-transaction-repository';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import {
  SubscriptionPlanTier,
  SubscriptionStatus,
  TransactionStatus,
  ChecklistCategory,
  CampaignStatus,
} from '@/domain/enums';
import { PlanConfig } from '@/domain/entities';
import { revalidatePath } from 'next/cache';
import { sendAdminInviteEmail, isMailConfigured } from '@/infrastructure/services/email-service';
import { env } from '@/config/env';

const adminRepo = new SupabaseSystemAdminRepository();
const subRepo = new SupabaseSubscriptionRepository();
const txnRepo = new SupabaseTransactionRepository();

async function getAdminClient() {
  try {
    return createAdminSupabaseClient();
  } catch {
    return await createServerSupabaseClient();
  }
}

async function assertSystemAdmin() {
  const session = await getCurrentUserSession();
  const isAdmin = await adminRepo.isSystemAdmin(session.user.id);
  if (!isAdmin && !session.user.isSystemAdmin) {
    throw new Error('Yêu cầu quyền Quản trị viên hệ thống (403 Forbidden).');
  }
  return session.user;
}

// 1. Dashboard Overview
export async function getAdminOverviewAction() {
  await assertSystemAdmin();
  const supabase = await getAdminClient();

  const [
    { count: totalUsers },
    { count: activeCampaigns },
    { count: totalBooths },
    { transactions },
    { subscriptions },
    { data: profiles },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', CampaignStatus.ACTIVE),
    supabase.from('booths').select('*', { count: 'exact', head: true }),
    txnRepo.getAll(),
    subRepo.getAll(),
    supabase.from('profiles').select('id, full_name, email'),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  const successfulTxns = transactions.filter((t) => t.status === TransactionStatus.SUCCESS);
  const totalRevenue = successfulTxns.reduce((sum, t) => sum + t.amount, 0);

  // Latest 6 transactions with customer info
  const recentTransactions = transactions.slice(0, 6).map((t) => ({
    id: t.id,
    transactionCode: t.transactionCode,
    amount: t.amount,
    currency: t.currency,
    status: t.status,
    plan: t.plan,
    provider: t.provider,
    createdAt: t.createdAt,
    customerName: profileMap.get(t.userId)?.full_name || 'Khách hàng',
    customerEmail: profileMap.get(t.userId)?.email || '',
  }));

  // Real 6-month revenue calculation from successful transactions
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0 to 11

  const monthlyRevenue = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(currentYear, currentMonth - i, 1);
    const yr = d.getFullYear();
    const mo = d.getMonth();
    const monthKey = `T${mo + 1}`;
    const fullMonthName = `Tháng ${mo + 1}/${yr}`;

    const monthTxns = successfulTxns.filter((t) => {
      const dt = new Date(t.createdAt);
      return dt.getFullYear() === yr && dt.getMonth() === mo;
    });

    const amount = monthTxns.reduce((sum, t) => sum + t.amount, 0);

    monthlyRevenue.push({
      month: monthKey,
      fullMonthName,
      amount,
      count: monthTxns.length,
      isCurrent: i === 0,
    });
  }

  const maxMonthAmount = Math.max(...monthlyRevenue.map((m) => m.amount), 0);
  const monthlyRevenueWithHeight = monthlyRevenue.map((m) => ({
    ...m,
    height: maxMonthAmount > 0
      ? `${Math.max(6, Math.round((m.amount / maxMonthAmount) * 100))}%`
      : '4px',
  }));

  // Real growth calculation: current month vs previous month
  const curMonthAmount = monthlyRevenue[5].amount;
  const prevMonthAmount = monthlyRevenue[4].amount;
  let revenueGrowthRate = 0;
  if (prevMonthAmount > 0) {
    revenueGrowthRate = Math.round(((curMonthAmount - prevMonthAmount) / prevMonthAmount) * 100);
  } else if (curMonthAmount > 0) {
    revenueGrowthRate = 100;
  } else {
    revenueGrowthRate = 0;
  }

  // Real Plan distribution counts
  const starterCount = subscriptions.filter((s) => s.plan === SubscriptionPlanTier.STARTER).length;
  const proCount = subscriptions.filter((s) => s.plan === SubscriptionPlanTier.PRO).length;
  const explicitFreeCount = subscriptions.filter((s) => s.plan === SubscriptionPlanTier.FREE).length;
  const totalProfilesCount = totalUsers || (profiles || []).length;
  const freeCount = Math.max(explicitFreeCount, Math.max(0, totalProfilesCount - starterCount - proCount));

  const planDistribution = {
    free: freeCount,
    starter: starterCount,
    pro: proCount,
  };

  return {
    totalUsers: totalUsers || 0,
    activeCampaigns: activeCampaigns || 0,
    totalBooths: totalBooths || 0,
    totalRevenue,
    recentTransactions,
    planDistribution,
    monthlyRevenue: monthlyRevenueWithHeight,
    revenueGrowthRate,
    currentMonthLabel: `Tháng ${currentMonth + 1}/${currentYear}`,
  };
}

// 2. Admins & Invites
export async function getAdminsAction() {
  await assertSystemAdmin();
  const [admins, invites] = await Promise.all([
    adminRepo.getAdmins(),
    adminRepo.getInvites(),
  ]);
  return { admins, invites };
}

export async function inviteAdminAction(email: string) {
  const currentUser = await assertSystemAdmin();
  const invite = await adminRepo.createInvite(email, currentUser.id);

  const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/auth/invite?email=${encodeURIComponent(invite.email)}&type=admin`;
  let emailSent = false;
  let emailError: string | null = null;

  try {
    if (isMailConfigured()) {
      await sendAdminInviteEmail({
        to: invite.email,
        inviterName: currentUser.fullName || currentUser.email || 'Quản trị viên',
        inviteLink,
      });
      emailSent = true;
    } else {
      emailError = 'Chưa cấu hình SMTP_USER và SMTP_PASSWORD trong file .env.local';
    }
  } catch (err: any) {
    console.error('Lỗi gửi email mời admin:', err);
    emailError = err.message || 'Không thể kết nối đến máy chủ gửi email Google SMTP.';
  }

  revalidatePath('/admin/admins');
  return {
    ...invite,
    inviteLink,
    emailSent,
    emailError,
  };
}

export async function resendAdminInviteEmailAction(inviteId: string) {
  const currentUser = await assertSystemAdmin();
  const invites = await adminRepo.getInvites();
  const invite = invites.find((i) => i.id === inviteId);
  if (!invite) {
    throw new Error('Không tìm thấy thông tin lời mời.');
  }

  const inviteLink = `${env.NEXT_PUBLIC_APP_URL}/auth/invite?email=${encodeURIComponent(invite.email)}&type=admin`;
  await sendAdminInviteEmail({
    to: invite.email,
    inviterName: currentUser.fullName || currentUser.email || 'Quản trị viên',
    inviteLink,
  });

  return { success: true, inviteLink };
}

export async function revokeAdminAction(userId: string) {
  const currentUser = await assertSystemAdmin();
  if (currentUser.id === userId) {
    throw new Error('Bạn không thể tự thu hồi quyền Admin của chính mình.');
  }
  await adminRepo.revokeAdminRole(userId);
  revalidatePath('/admin/admins');
  return { success: true };
}

export async function revokeInviteAction(inviteId: string) {
  await assertSystemAdmin();
  await adminRepo.revokeInvite(inviteId);
  revalidatePath('/admin/admins');
  return { success: true };
}

// 3. Subscriptions Management
export async function getAdminSubscriptionsAction() {
  await assertSystemAdmin();
  const supabase = await getAdminClient();

  const [{ data: profiles }, { subscriptions }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, email, created_at'),
    subRepo.getAll(),
  ]);

  // Join profiles with subscriptions
  const subMap = new Map(subscriptions.map((s) => [s.userId, s]));
  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  // Merge all unique user IDs from both profiles and subscriptions
  const allUserIds = new Set([
    ...(profiles || []).map((p) => p.id),
    ...subscriptions.map((s) => s.userId),
  ]);

  const usersWithSubs = Array.from(allUserIds).map((userId) => {
    const profile = profileMap.get(userId);
    const sub = subMap.get(userId);
    return {
      userId,
      fullName: profile?.full_name || 'Khách hàng',
      email: profile?.email || 'Chưa rõ email',
      plan: sub?.plan || SubscriptionPlanTier.FREE,
      status: sub?.status || SubscriptionStatus.ACTIVE,
      expiresAt: sub?.expiresAt || null,
      createdAt: profile?.created_at || new Date().toISOString(),
    };
  });

  return usersWithSubs;
}

export async function manualUpdateSubscriptionAction(
  userId: string,
  plan: SubscriptionPlanTier,
  daysValid: number = 30
) {
  await assertSystemAdmin();
  const expiresAt =
    plan === SubscriptionPlanTier.FREE
      ? null
      : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  const updated = await subRepo.upsert({
    userId,
    plan,
    status: SubscriptionStatus.ACTIVE,
    expiresAt,
  });

  revalidatePath('/admin/subscriptions');
  revalidatePath('/settings/billing');
  return updated;
}

export async function batchUpdateSubscriptionsAction(
  userIds: string[],
  plan: SubscriptionPlanTier,
  daysValid: number = 30
) {
  await assertSystemAdmin();
  const expiresAt =
    plan === SubscriptionPlanTier.FREE
      ? null
      : new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);

  await Promise.all(
    userIds.map((userId) =>
      subRepo.upsert({
        userId,
        plan,
        status: SubscriptionStatus.ACTIVE,
        expiresAt,
      })
    )
  );

  revalidatePath('/admin/subscriptions');
  revalidatePath('/settings/billing');
  return { success: true, count: userIds.length };
}

// 4. Transactions Management
export async function getAdminTransactionsAction() {
  await assertSystemAdmin();
  const supabase = await getAdminClient();
  const [{ transactions }, { data: profiles }] = await Promise.all([
    txnRepo.getAll(),
    supabase.from('profiles').select('id, full_name, email'),
  ]);

  const profileMap = new Map((profiles || []).map((p) => [p.id, p]));

  return transactions.map((t) => ({
    ...t,
    userFullName: profileMap.get(t.userId)?.full_name || 'Người dùng',
    userEmail: profileMap.get(t.userId)?.email || 'Chưa rõ',
  }));
}



// 5. Checklist Templates
export async function getChecklistTemplatesAction() {
  const supabase = await createServerSupabaseClient();
  const [{ data: templates, error: tErr }, { data: items, error: iErr }] = await Promise.all([
    supabase.from('checklist_templates').select('*').order('created_at', { ascending: false }),
    supabase.from('checklist_template_items').select('*').order('order_index', { ascending: true }),
  ]);

  if (tErr) throw new Error(tErr.message);
  if (iErr) throw new Error(iErr.message);

  const itemsMap = new Map<string, typeof items>();
  (items || []).forEach((item) => {
    const list = itemsMap.get(item.template_id) || [];
    list.push(item);
    itemsMap.set(item.template_id, list);
  });

  return (templates || []).map((t) => ({
    ...t,
    items: itemsMap.get(t.id) || [],
  }));
}

export async function createChecklistTemplateAction(params: {
  name: string;
  code: string;
  description?: string;
  category: ChecklistCategory;
  items: Array<{
    title: string;
    description?: string;
    category: ChecklistCategory;
    isRequired: boolean;
  }>;
}) {
  await assertSystemAdmin();
  const supabase = await createServerSupabaseClient();

  const { data: template, error: tErr } = await supabase
    .from('checklist_templates')
    .insert({
      name: params.name,
      code: params.code.toUpperCase().trim(),
      description: params.description || null,
      category: params.category,
      is_active: true,
    })
    .select('*')
    .single();

  if (tErr) throw new Error(`Lỗi tạo mẫu: ${tErr.message}`);

  if (params.items && params.items.length > 0) {
    const rows = params.items.map((item, index) => ({
      template_id: template.id,
      title: item.title,
      description: item.description || null,
      category: item.category,
      is_required: item.isRequired,
      order_index: index,
    }));

    const { error: iErr } = await supabase.from('checklist_template_items').insert(rows);
    if (iErr) throw new Error(`Lỗi tạo tiêu chí: ${iErr.message}`);
  }

  revalidatePath('/admin/templates');
  return template;
}

export async function deleteChecklistTemplateAction(templateId: string) {
  await assertSystemAdmin();
  const supabase = await createServerSupabaseClient();
  const { error } = await supabase.from('checklist_templates').delete().eq('id', templateId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin/templates');
  return { success: true };
}

// 6. Plan Configurations Management
export async function getAdminPlanConfigsAction(): Promise<PlanConfig[]> {
  await assertSystemAdmin();
  return subRepo.getPlanConfigs();
}

export async function updateAdminPlanConfigAction(
  tier: SubscriptionPlanTier,
  data: {
    name?: string;
    priceMonthlyVnd?: number;
    maxActiveCampaigns?: number;
    description?: string;
    features?: string[];
    isPopular?: boolean;
    isActive?: boolean;
  }
): Promise<PlanConfig> {
  await assertSystemAdmin();

  if (data.priceMonthlyVnd !== undefined && data.priceMonthlyVnd < 0) {
    throw new Error('Giá niêm yết không được âm.');
  }

  if (data.maxActiveCampaigns !== undefined && data.maxActiveCampaigns < 1) {
    throw new Error('Hạn mức chiến dịch tối thiểu là 1.');
  }

  const updated = await subRepo.updatePlanConfig(tier, data);

  revalidatePath('/admin/subscriptions');
  revalidatePath('/admin/plans');
  revalidatePath('/settings/billing');
  revalidatePath('/campaigns/new');

  return updated;
}

// 7. Payment Gateway & Bank Beneficiary Info (Readonly)
export async function getPaymentGatewayConfigAction() {
  await assertSystemAdmin();
  const { BENEFICIARY_BANK, isPayOSConfigured } = await import('@/infrastructure/payos/payos-client');

  const clientId = process.env.PAYOS_CLIENT_ID || '';
  const maskedClientId =
    clientId.length > 8
      ? `${clientId.slice(0, 4)}••••••••${clientId.slice(-4)}`
      : clientId
      ? '••••••••'
      : 'Chưa thiết lập';

  return {
    beneficiaryBank: {
      bankName: BENEFICIARY_BANK.bankName,
      bankBin: BENEFICIARY_BANK.bankBin,
      accountNumber: BENEFICIARY_BANK.accountNumber,
      accountName: BENEFICIARY_BANK.accountName,
      transferSyntaxPrefix: 'EVENTGO',
      branch: 'Hội sở chính MB Bank - Toàn quốc',
    },
    payos: {
      isConfigured: isPayOSConfigured,
      maskedClientId,
      hasApiKey: Boolean(process.env.PAYOS_API_KEY),
      hasChecksumKey: Boolean(process.env.PAYOS_CHECKSUM_KEY),
      webhookUrl: `${env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/webhooks/payos`,
      gatewayName: 'PayOS VietQR Napas 24/7',
    },
    isReadonly: true,
  };
}
