import { createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { requireCampaignManager } from '@/application/authorization/campaign-access';
import { getCampaignDetailsUseCase } from './get-campaign-details';
import { validateCampaignActivationUseCase } from './validate-campaign-activation';
import { CHECKLIST_TEMPLATE_PRESETS, ChecklistTemplatePreset } from '@/domain/constants/checklist-templates';
import { Campaign, Location, Booth, ChecklistItem, CampaignMember } from '@/domain/entities';
import { CampaignRole } from '@/domain/enums';

export interface CampaignWizardData {
  campaign: Campaign;
  locations: (Location & {
    booths: (Booth & {
      checklistItems: ChecklistItem[];
      isInheritedSupervisor?: boolean;
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
  }[];
  supervisors: CampaignMember[];
  approvers: CampaignMember[];
  templates: ChecklistTemplatePreset[];
  readiness: {
    canActivate: boolean;
    errors: string[];
    stats: {
      totalLocations: number;
      totalBooths: number;
      boothsWithChecklist: number;
      boothsWithSupervisor: number;
      boothsWithApprover: number;
      boothsFullyStaffed: number;
    };
  };
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

  // 5. Fetch Campaign Members with Profiles
  const { data: membersData } = await supabase
    .from('campaign_members')
    .select('*, profiles:user_id(id, full_name, email, avatar_url, phone)')
    .eq('campaign_id', campaignId)
    .eq('status', 'ACTIVE' as any);

  const members: CampaignMember[] = (membersData || []).map((m: any) => ({
    id: m.id,
    campaignId: m.campaign_id,
    userId: m.user_id,
    role: m.role as CampaignRole,
    status: m.status as any,
    fullName: m.profiles?.full_name || 'Không rõ',
    email: m.profiles?.email || '',
    avatarUrl: m.profiles?.avatar_url || null,
    createdAt: new Date(m.created_at),
    updatedAt: new Date(m.updated_at),
  }));

  const memberMap = new Map<string, CampaignMember>();
  members.forEach((m) => memberMap.set(m.id, m));

  const supervisors = members.filter((m) => m.role === CampaignRole.SUPERVISOR);
  const approvers = members.filter((m) => m.role === CampaignRole.APPROVER);

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

  // Map assignments to booths
  const supByBooth = new Map<string, string>();
  supAssignments.forEach((s) => supByBooth.set(s.booth_id, s.supervisor_member_id));

  const appByBooth = new Map<string, string>();
  appAssignments.forEach((a) => appByBooth.set(a.booth_id, a.approver_member_id));

  // Map booths to locations
  const boothsByLocation = new Map<string, any[]>();
  const allBoothsFormatted: CampaignWizardData['allBooths'] = [];

  const locMap = new Map<string, string>();
  locRows.forEach((l) => locMap.set(l.id, l.name));

  boothRows.forEach((b) => {
    const items = checklistsByBooth.get(b.id) || [];
    const supMemberId = supByBooth.get(b.id) || null;
    const supMember = supMemberId ? memberMap.get(supMemberId) : null;
    const appMemberId = appByBooth.get(b.id) || null;
    const appMember = appMemberId ? memberMap.get(appMemberId) : null;

    const parentLoc = locRows.find((l) => l.id === b.location_id);
    const locDefaultSupId = (parentLoc as any)?.default_supervisor_member_id;
    const isInherited = Boolean(locDefaultSupId && supMemberId === locDefaultSupId);

    const boothObj = {
      id: b.id,
      locationId: b.location_id,
      name: b.name,
      code: b.code,
      description: b.description,
      deadline: b.deadline ? new Date(b.deadline) : null,
      supervisorMemberId: supMemberId,
      supervisorName: supMember ? supMember.fullName : null,
      isInheritedSupervisor: isInherited,
      approverMemberId: appMemberId,
      approverName: appMember ? appMember.fullName : null,
      checklistCount: items.length,
      checklistItems: items,
      createdAt: new Date(b.created_at),
      updatedAt: new Date(b.updated_at),
    };

    const list = boothsByLocation.get(b.location_id) || [];
    list.push(boothObj);
    boothsByLocation.set(b.location_id, list);

    allBoothsFormatted.push({
      id: b.id,
      name: b.name,
      code: b.code,
      locationId: b.location_id,
      locationName: locMap.get(b.location_id) || '',
      checklistCount: items.length,
      supervisorName: supMember ? supMember.fullName : null,
      approverName: appMember ? appMember.fullName : null,
    });
  });

  // Construct structured locations
  const structuredLocations = locRows.map((l) => {
    const childBooths = boothsByLocation.get(l.id) || [];
    const defaultSupId = (l as any).default_supervisor_member_id || null;
    const defaultSup = defaultSupId ? memberMap.get(defaultSupId) : null;

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
    // Fallback to presets if db table is not yet present
    templates = CHECKLIST_TEMPLATE_PRESETS;
  }

  // 7. Readiness check
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

  allBoothsFormatted.forEach((b) => {
    if (b.checklistCount > 0) boothsWithChecklist++;
    if (b.supervisorName) boothsWithSupervisor++;
    if (b.approverName) boothsWithApprover++;
    if (b.supervisorName && b.approverName) boothsFullyStaffed++;
  });

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
      stats: {
        totalLocations: structuredLocations.length,
        totalBooths: allBoothsFormatted.length,
        boothsWithChecklist,
        boothsWithSupervisor,
        boothsWithApprover,
        boothsFullyStaffed,
      },
    },
  };
}
