import { CampaignRole, CampaignStatus } from '@/domain/enums';
import { Campaign } from '@/domain/entities';
import { getManagedCampaignsUseCase } from './get-managed-campaigns';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';

export interface CampaignWithProgress extends Campaign {
  locationCount: number;
  boothCount: number;
  setupProgress: number; // 0 - 100
  isFullyConfigured: boolean;
}

export async function getManagedCampaignsWithProgressUseCase(): Promise<CampaignWithProgress[]> {
  const campaigns = await getManagedCampaignsUseCase();
  if (campaigns.length === 0) return [];

  const supabase = await createServerSupabaseClient();
  const campaignIds = campaigns.map((c) => c.id);

  // 1. Fetch locations for all these campaigns
  const { data: locationsData } = await supabase
    .from('locations')
    .select('id, campaign_id')
    .in('campaign_id', campaignIds);

  const locations = locationsData || [];
  const locationIds = locations.map((l) => l.id);

  // 2. Fetch booths for all these locations
  let booths: { id: string; location_id: string }[] = [];
  if (locationIds.length > 0) {
    const { data: boothsData } = await supabase
      .from('booths')
      .select('id, location_id')
      .in('location_id', locationIds);
    booths = boothsData || [];
  }

  const boothIds = booths.map((b) => b.id);

  // 3. Fetch checklist item counts per booth
  const checklistCountsByBooth = new Map<string, number>();
  if (boothIds.length > 0) {
    const { data: checklistData } = await supabase
      .from('checklist_items')
      .select('booth_id')
      .in('booth_id', boothIds);

    (checklistData || []).forEach((item) => {
      checklistCountsByBooth.set(item.booth_id, (checklistCountsByBooth.get(item.booth_id) || 0) + 1);
    });
  }

  // 4. Fetch supervisor assignments
  const supervisorAssignments = new Set<string>();
  if (boothIds.length > 0) {
    const { data: supData } = await supabase
      .from('booth_supervisor_assignments')
      .select('booth_id')
      .in('booth_id', boothIds);
    (supData || []).forEach((s) => supervisorAssignments.add(s.booth_id));
  }

  // 5. Fetch approver assignments
  const approverAssignments = new Set<string>();
  if (boothIds.length > 0) {
    const { data: appData } = await supabase
      .from('booth_approver_assignments')
      .select('booth_id')
      .in('booth_id', boothIds);
    (appData || []).forEach((a) => approverAssignments.add(a.booth_id));
  }

  // 6. Map locations to campaigns and booths to locations
  const locationsByCampaign = new Map<string, typeof locations>();
  locations.forEach((loc) => {
    const arr = locationsByCampaign.get(loc.campaign_id) || [];
    arr.push(loc);
    locationsByCampaign.set(loc.campaign_id, arr);
  });

  const boothsByLocation = new Map<string, typeof booths>();
  booths.forEach((b) => {
    const arr = boothsByLocation.get(b.location_id) || [];
    arr.push(b);
    boothsByLocation.set(b.location_id, arr);
  });

  return campaigns.map((campaign) => {
    if (campaign.status === CampaignStatus.ACTIVE || campaign.status === CampaignStatus.COMPLETED) {
      const campLocs = locationsByCampaign.get(campaign.id) || [];
      let totalBooths = 0;
      campLocs.forEach((l) => {
        totalBooths += (boothsByLocation.get(l.id) || []).length;
      });

      return {
        ...campaign,
        locationCount: campLocs.length,
        boothCount: totalBooths,
        setupProgress: 100,
        isFullyConfigured: true,
      };
    }

    // Calculate progress for DRAFT
    let progress = 0;

    // Weight 1: Info (20%)
    if (campaign.title && campaign.companyName && campaign.brandName && campaign.startDate && campaign.endDate) {
      progress += 20;
    }

    const campLocs = locationsByCampaign.get(campaign.id) || [];
    const campBooths: typeof booths = [];
    let emptyLocations = 0;

    campLocs.forEach((loc) => {
      const bList = boothsByLocation.get(loc.id) || [];
      if (bList.length === 0) emptyLocations++;
      campBooths.push(...bList);
    });

    const locationCount = campLocs.length;
    const boothCount = campBooths.length;

    // Weight 2: Structure (25%)
    if (locationCount > 0 && emptyLocations === 0 && boothCount > 0) {
      progress += 25;
    } else if (locationCount > 0) {
      progress += 10;
    }

    // Weight 3: Checklist (25%)
    if (boothCount > 0) {
      const boothsWithChecklist = campBooths.filter(
        (b) => (checklistCountsByBooth.get(b.id) || 0) > 0
      ).length;
      progress += Math.round((boothsWithChecklist / boothCount) * 25);
    }

    // Weight 4: Personnel (30%)
    if (boothCount > 0) {
      const boothsFullyStaffed = campBooths.filter(
        (b) => supervisorAssignments.has(b.id) && approverAssignments.has(b.id)
      ).length;
      progress += Math.round((boothsFullyStaffed / boothCount) * 30);
    }

    const finalProgress = Math.min(progress, 100);

    return {
      ...campaign,
      locationCount,
      boothCount,
      setupProgress: finalProgress,
      isFullyConfigured: finalProgress === 100,
    };
  });
}
