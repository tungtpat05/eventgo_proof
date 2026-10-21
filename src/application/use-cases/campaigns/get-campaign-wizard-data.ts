import { createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { getCampaignDetailsUseCase } from './get-campaign-details';
import { validateCampaignActivationUseCase } from './validate-campaign-activation';
import { CHECKLIST_TEMPLATE_PRESETS, ChecklistTemplatePreset } from '@/domain/constants/checklist-templates';
import { Campaign, Location, Booth, ChecklistItem, CampaignMember } from '@/domain/entities';
import { CampaignRole, CampaignStatus, CampaignMemberStatus, SubscriptionPlanTier } from '@/domain/enums';
import { SupabaseSubscriptionRepository } from '@/infrastructure/repositories/supabase-subscription-repository';

export interface SubscriptionQuota {
  tier: SubscriptionPlanTier;
  planName: string;
  maxActiveCampaigns: number;
  activeCampaignCount: number;
  remainingSlots: number;
  isAtQuotaLimit: boolean;
}

export interface WizardPersonnelOption extends CampaignMember {
  isPending?: boolean;
  inviteId?: string;
}

export interface CampaignWizardData {
  campaign: Campaign;
  locations: (Location & {
    booths: (Booth & {
      checklistItems: ChecklistItem[];
      isInheritedSupervisor?: boolean;
      isSupervisorPending?: boolean;
      isApproverPending?: boolean;
    })[];
  })[];
  allBooths: {
    id: string;
    name: string;
    code?: string | null;
    locationId: string;
    locationName: string;
    checklistCount: number;
    supervisorName?: string | null;
    approverName?: string | null;
    supervisorMemberId?: string | null;
    approverMemberId?: string | null;
    isSupervisorPending?: boolean;
    isApproverPending?: boolean;
  }[];
  supervisors: WizardPersonnelOption[];
  approvers: WizardPersonnelOption[];
  templates: ChecklistTemplatePreset[];
  readiness: {
    canActivate: boolean;
    errors: string[];
    warnings: string[];
    stats: {
      totalLocations: number;
      totalBooths: number;
      boothsWithChecklist: number;
      boothsWithSupervisor: number;
      boothsWithApprover: number;
      boothsFullyStaffed: number;
      boothsWithPendingStaff: number;
    };
  };
  subscriptionQuota: SubscriptionQuota;
}

export async function getCampaignWizardDataUseCase(campaignId: string): Promise<CampaignWizardData | null> {
  await requireCampaignManager(campaignId);

  const campaign = await getCampaignDetailsUseCase(campaignId);
  if (!campaign) return null;

  const supabase = createAdminSupabaseClient();

  // 1. Fetch Locations
  const { data: locsData } = await supabase
    .from('locations')
    .select('*')
    .eq('campaign_id', campaignId)
    .order('name');

  const locRows = locsData || [];
  const locationIds = locRows.map((l) => l.id);

  // 2. Fetch Booths
  let boothRows: any[] = [];
  if (locationIds.length > 0) {
    const { data: bData } = await supabase
      .from('booths')
      .select('*')
      .in('location_id', locationIds)
      .order('name');
    boothRows = bData || [];
  }
  const boothIds = boothRows.map((b) => b.id);

  // 3. Fetch Checklist items
  let checklistRows: any[] = [];
  if (boothIds.length > 0) {
    const { data: cData } = await supabase
      .from('checklist_items')
      .select('*')
      .in('booth_id', boothIds)
      .order('order_index');
    checklistRows = cData || [];
  }

  // 4. Fetch Booth assignments
  let supAssignments: any[] = [];
  let appAssignments: any[] = [];
  if (boothIds.length > 0) {
    const [{ data: sData }, { data: aData }] = await Promise.all([
      supabase.from('booth_supervisor_assignments').select('*').in('booth_id', boothIds),
      supabase.from('booth_approver_assignments').select('*').in('booth_id', boothIds),
    ]);
    supAssignments = sData || [];
    appAssignments = aData || [];
  }

  // 5. Fetch Campaign Members (ACTIVE) AND Pending Invites
  const [{ data: membersData }, { data: invitesData }] = await Promise.all([
    supabase
      .from('campaign_members')
      .select('*, profiles:user_id(id, full_name, email, avatar_url, phone)')
      .eq('campaign_id', campaignId)
      .eq('status', 'ACTIVE' as any),
    supabase
      .from('campaign_invites')
      .select('*')
      .eq('campaign_id', campaignId)
      .eq('status', 'PENDING' as any),
  ]);

  const activeMembers: WizardPersonnelOption[] = (membersData || []).map((m: any) => ({
    id: m.id,
    campaignId: m.campaign_id,
    userId: m.user_id,
    role: m.role as CampaignRole,
    status: m.status as any,
    isPending: false,
    fullName: m.profiles?.full_name || 'Thành viên',
    email: m.profiles?.email || '',
    avatarUrl: m.profiles?.avatar_url || null,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
  }));

  const pendingMembers: WizardPersonnelOption[] = (invitesData || []).map((inv: any) => ({
    id: `invite_${inv.id}`,
    inviteId: inv.id,
    campaignId: inv.campaign_id,
    userId: '',
    role: inv.role as CampaignRole,
    status: CampaignMemberStatus.ACTIVE,
    isPending: true,
    fullName: inv.email,
    email: inv.email,
    avatarUrl: null,
    createdAt: new Date(inv.created_at),
    updatedAt: new Date(inv.created_at),
  }));

  const allPersonnel = [...activeMembers, ...pendingMembers];
  const personnelMap = new Map<string, WizardPersonnelOption>();
  allPersonnel.forEach((m) => personnelMap.set(m.id, m));

  const supervisors = allPersonnel.filter((m) => m.role === CampaignRole.SUPERVISOR);
  const approvers = allPersonnel.filter((m) => m.role === CampaignRole.APPROVER);

  // Map checklists to booths
  const checklistsByBooth = new Map<string, ChecklistItem[]>();
  checklistRows.forEach((c) => {
    const list = checklistsByBooth.get(c.booth_id) || [];
    list.push({
      id: c.id,
      boothId: c.booth_id,
      title: c.title,
      description: c.description,
      category: c.category,
      isRequired: c.is_required,
      orderIndex: c.order_index,
      createdAt: new Date(c.created_at),
      updatedAt: new Date(c.updated_at),
    });
    checklistsByBooth.set(c.booth_id, list);
  });

  // Map assignments to booths (Hỗ trợ cả member_id và invite_id)
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

  // Map booths to locations
  const boothsByLocation = new Map<string, any[]>();
  const allBoothsFormatted: CampaignWizardData['allBooths'] = [];

  const locMap = new Map<string, string>();
  locRows.forEach((l) => locMap.set(l.id, l.name));

  boothRows.forEach((b) => {
    const items = checklistsByBooth.get(b.id) || [];
    const supKey = supByBooth.get(b.id) || null;
    const supMember = supKey ? personnelMap.get(supKey) : null;
    const appKey = appByBooth.get(b.id) || null;
    const appMember = appKey ? personnelMap.get(appKey) : null;

    const parentLoc = locRows.find((l) => l.id === b.location_id);
    const locDefaultSupId = (parentLoc as any)?.default_supervisor_member_id;
    const isInherited = Boolean(locDefaultSupId && supKey === locDefaultSupId);

    const boothObj = {
      id: b.id,
      locationId: b.location_id,
      name: b.name,
      code: b.code,
      description: b.description,
      deadline: b.deadline ? new Date(b.deadline) : null,
      supervisorMemberId: supKey,
      supervisorName: supMember ? supMember.fullName : null,
      isSupervisorPending: supMember?.isPending || false,
      isInheritedSupervisor: isInherited,
      approverMemberId: appKey,
      approverName: appMember ? appMember.fullName : null,
      isApproverPending: appMember?.isPending || false,
      checklistCount: items.length,
      checklistItems: items,
    };

    const locList = boothsByLocation.get(b.location_id) || [];
    locList.push(boothObj);
    boothsByLocation.set(b.location_id, locList);

    allBoothsFormatted.push({
      id: b.id,
      name: b.name,
      code: b.code,
      locationId: b.location_id,
      locationName: locMap.get(b.location_id) || 'Không rõ',
      checklistCount: items.length,
      supervisorMemberId: supKey,
      supervisorName: supMember ? supMember.fullName : null,
      isSupervisorPending: supMember?.isPending || false,
      approverMemberId: appKey,
      approverName: appMember ? appMember.fullName : null,
      isApproverPending: appMember?.isPending || false,
    });
  });

  // Construct structured locations
  const structuredLocations = locRows.map((l) => {
    const childBooths = boothsByLocation.get(l.id) || [];
    const defaultSupId = (l as any).default_supervisor_member_id || null;
    const defaultSup = defaultSupId ? personnelMap.get(defaultSupId) : null;

    return {
      id: l.id,
      campaignId: l.campaign_id,
      name: l.name,
      address: l.address,
      city: l.city,
      deadline: l.deadline ? new Date(l.deadline) : null,
      defaultSupervisorMemberId: defaultSupId,
      defaultSupervisorName: defaultSup ? defaultSup.fullName : null,
      booths: childBooths,
      createdAt: new Date(l.created_at),
      updatedAt: new Date(l.updated_at),
    };
  });

  // 6. Templates
  let templates = CHECKLIST_TEMPLATE_PRESETS;
  try {
    const { data: dbTemplates } = await supabase
      .from('checklist_templates')
      .select('*, items:checklist_template_items(*)')
      .eq('is_active', true);

    if (dbTemplates && dbTemplates.length > 0) {
      templates = dbTemplates.map((t: any) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        description: t.description || '',
        items: (t.items || []).map((it: any) => ({
          title: it.title,
          description: it.description || '',
          category: it.category,
          isRequired: it.is_required,
          orderIndex: it.order_index,
        })),
      }));
    }
  } catch (err) {
    templates = CHECKLIST_TEMPLATE_PRESETS;
  }

  // 7. Readiness check & Warnings
  let readinessResult = { canActivate: false, errors: [] as string[] };
  try {
    readinessResult = await validateCampaignActivationUseCase(campaignId);
  } catch (err: any) {
    readinessResult = { canActivate: false, errors: [err.message || 'Chưa thể kích hoạt'] };
  }

  let boothsWithChecklist = 0;
  let boothsWithSupervisor = 0;
  let boothsWithApprover = 0;
  let boothsFullyStaffed = 0;
  let boothsWithPendingStaff = 0;

  allBoothsFormatted.forEach((b) => {
    if (b.checklistCount > 0) boothsWithChecklist++;
    if (b.supervisorName) boothsWithSupervisor++;
    if (b.approverName) boothsWithApprover++;
    if (b.supervisorName && b.approverName) boothsFullyStaffed++;
    if (b.isSupervisorPending || b.isApproverPending) boothsWithPendingStaff++;
  });

  const warnings: string[] = [];
  if (boothsWithPendingStaff > 0) {
    warnings.push(
      `Có ${boothsWithPendingStaff} gian hàng đang được phân công cho nhân sự chưa kích hoạt tài khoản Google. Các gian hàng này sẽ tạm khóa tính năng nộp bằng chứng cho đến khi nhân sự đăng nhập chấp nhận lời mời.`
    );
  }

  // 8. Subscription Quota Calculation
  let subscriptionQuota: SubscriptionQuota = {
    tier: SubscriptionPlanTier.FREE,
    planName: 'Free',
    maxActiveCampaigns: 2,
    activeCampaignCount: 0,
    remainingSlots: 2,
    isAtQuotaLimit: false,
  };

  try {
    const ownerId = campaign.createdBy;
    if (ownerId) {
      const subRepo = new SupabaseSubscriptionRepository();
      const sub = await subRepo.getByUserId(ownerId);
      const planTier = sub?.plan || SubscriptionPlanTier.FREE;
      const planConfig = await subRepo.getPlanConfigByTier(planTier);

      const { count: activeCount } = await supabase
        .from('campaigns')
        .select('*', { count: 'exact', head: true })
        .eq('created_by', ownerId)
        .eq('status', CampaignStatus.ACTIVE);

      const activeNum = activeCount || 0;
      const isAlreadyActive = campaign.status === CampaignStatus.ACTIVE;
      const isAtQuota = !isAlreadyActive && activeNum >= planConfig.maxActiveCampaigns;

      subscriptionQuota = {
        tier: planTier,
        planName: planConfig.name,
        maxActiveCampaigns: planConfig.maxActiveCampaigns,
        activeCampaignCount: activeNum,
        remainingSlots: Math.max(0, planConfig.maxActiveCampaigns - activeNum),
        isAtQuotaLimit: isAtQuota,
      };
    }
  } catch (err) {
    // Non-blocking fallback
  }

  return {
    campaign,
    locations: structuredLocations,
    allBooths: allBoothsFormatted,
    supervisors,
    approvers,
    templates,
    readiness: {
      canActivate: readinessResult.canActivate,
      errors: readinessResult.errors,
      warnings,
      stats: {
        totalLocations: structuredLocations.length,
        totalBooths: allBoothsFormatted.length,
        boothsWithChecklist,
        boothsWithSupervisor,
        boothsWithApprover,
        boothsFullyStaffed,
        boothsWithPendingStaff,
      },
    },
    subscriptionQuota,
  };
}
