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
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('campaigns').select('*', { count: 'exact', head: true }).eq('status', CampaignStatus.ACTIVE),
    supabase.from('booths').select('*', { count: 'exact', head: true }),
    txnRepo.getAll(),
  ]);

  const totalRevenue = transactions
    .filter((t) => t.status === TransactionStatus.SUCCESS)
    .reduce((sum, t) => sum + t.amount, 0);

  const pendingTransactionsCount = transactions.filter(
    (t) => t.status === TransactionStatus.PENDING
  ).length;

  return {
    totalUsers: totalUsers || 0,
    activeCampaigns: activeCampaigns || 0,
    totalBooths: totalBooths || 0,
    totalRevenue,
    pendingTransactionsCount,
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
  const result = await adminRepo.createInvite(email, currentUser.id);
  revalidatePath('/admin/admins');
  return result;
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

export async function manualApproveTransactionAction(transactionId: string) {
  await assertSystemAdmin();
  const txn = await txnRepo.getById(transactionId);
  if (!txn) throw new Error('Không tìm thấy giao dịch.');

  // Update status to SUCCESS
  await txnRepo.updateStatus(transactionId, TransactionStatus.SUCCESS, {
    paidAt: new Date(),
    notes: 'Quản trị viên xác nhận thanh toán thủ công',
  });

  // Calculate new expiration
  const currentSub = await subRepo.getByUserId(txn.userId);
  let newExpiresAt: Date;

  if (
    currentSub &&
    currentSub.plan === txn.plan &&
    currentSub.expiresAt &&
    currentSub.expiresAt > new Date()
  ) {
    newExpiresAt = new Date(currentSub.expiresAt.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else {
    newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  }

  await subRepo.upsert({
    userId: txn.userId,
    plan: txn.plan,
    status: SubscriptionStatus.ACTIVE,
    expiresAt: newExpiresAt,
  });

  revalidatePath('/admin/transactions');
  revalidatePath('/admin/subscriptions');
  revalidatePath('/settings/billing');
  return { success: true };
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
  revalidatePath('/settings/billing');
  revalidatePath('/campaigns/new');

  return updated;
}
