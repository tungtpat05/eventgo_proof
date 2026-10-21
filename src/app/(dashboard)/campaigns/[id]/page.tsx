import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { SupabaseLocationRepository } from '@/infrastructure/repositories/supabase-location-repository';
import { SupabaseCampaignMemberRepository } from '@/infrastructure/repositories/supabase-campaign-member-repository';
import { createAdminSupabaseClient } from '@/infrastructure/supabase/server';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import {
  Calendar,
  Tag,
  ArrowLeft,
  Building2,
  Sparkles,
} from 'lucide-react';
import { CampaignRole, CampaignStatus, SubmissionStatus } from '@/domain/enums';
import { Badge } from '@/components/ui/badge';
import { CampaignWorkspace } from '@/features/campaigns/components/workspace/campaign-workspace';

interface CampaignDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CampaignDetailPage({ params }: CampaignDetailPageProps) {
  const { id } = await params;

  let campaign;
  try {
    campaign = await getCampaignDetailsUseCase(id);
  } catch {
    notFound();
  }

  const isManager = campaign.currentUserRole === CampaignRole.MANAGER;
  const isDraft = campaign.status === CampaignStatus.DRAFT;

  const memberRepo = new SupabaseCampaignMemberRepository();
  const [locations, members, invites, history] = await Promise.all([
    new SupabaseLocationRepository().findByCampaign(id),
    isManager ? memberRepo.findByCampaign(id) : Promise.resolve([]),
    isManager ? memberRepo.findInvitesByCampaign(id) : Promise.resolve([]),
    isManager ? memberRepo.findHistoryByCampaign(id) : Promise.resolve([]),
  ]);

  // Compute operational stats
  const supabase = createAdminSupabaseClient();
  const locationIds = locations.map((l) => l.id);
  let totalBooths = 0;
  let missingStaffCount = 0;
  let boothIds: string[] = [];

  if (locationIds.length > 0) {
    const { data: bData } = await supabase
      .from('booths')
      .select('id, location_id')
      .in('location_id', locationIds);
    totalBooths = bData?.length || 0;
    boothIds = (bData || []).map((b) => b.id);
  }

  let submittedCount = 0;
  let approvedCount = 0;
  let pendingReviewsCount = 0;

  if (boothIds.length > 0) {
    const [{ count: subTotal }, { count: appTotal }, { count: revTotal }, { data: supAss }, { data: appAss }] =
      await Promise.all([
        supabase.from('submissions').select('*', { count: 'exact', head: true }).in('booth_id', boothIds),
        supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('booth_id', boothIds)
          .eq('status', SubmissionStatus.APPROVED),
        supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .in('booth_id', boothIds)
          .eq('status', SubmissionStatus.SUBMITTED),
        supabase.from('booth_supervisor_assignments').select('booth_id').in('booth_id', boothIds),
        supabase.from('booth_approver_assignments').select('booth_id').in('booth_id', boothIds),
      ]);

    submittedCount = subTotal || 0;
    approvedCount = appTotal || 0;
    pendingReviewsCount = revTotal || 0;

    const supAssignedSet = new Set((supAss || []).map((s) => s.booth_id));
    const appAssignedSet = new Set((appAss || []).map((a) => a.booth_id));

    boothIds.forEach((bId) => {
      if (!supAssignedSet.has(bId) || !appAssignedSet.has(bId)) {
        missingStaffCount++;
      }
    });
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Back button */}
      <div className="flex items-center gap-2">
        <Link href="/campaigns">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600 text-xs">
            <ArrowLeft className="h-3.5 w-3.5" />
            Quay lại danh sách chiến dịch
          </Button>
        </Link>
      </div>

      {/* Campaign Header Overview Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              {campaign.brandName && (
                <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200/60">
                  <Tag className="h-3 w-3" />
                  {campaign.brandName}
                </span>
              )}
              <StatusBadge status={campaign.status} />
              <Badge variant="outline" className="text-xs">{campaign.currentUserRole}</Badge>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{campaign.title}</h1>
            {campaign.description && (
              <p className="mt-2 text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">{campaign.description}</p>
            )}
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {isManager && isDraft && (
              <Link href={`/campaigns/${campaign.id}/wizard?step=${campaign.wizardStep || 1}`}>
                <Button size="sm" className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white font-semibold">
                  <Sparkles className="h-3.5 w-3.5" />
                  Tiếp tục thiết lập Wizard →
                </Button>
              </Link>
            )}
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-6 border-t border-slate-100 pt-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              Thời gian: <strong>{formatDate(campaign.startDate)}</strong> đến <strong>{formatDate(campaign.endDate)}</strong>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-slate-400" />
            <span>Công ty: <strong>{campaign.companyName}</strong></span>
          </div>
        </div>
      </div>

      {/* Workspace Hub (Tabs: Overview, Locations, Team, Approvals) */}
      <CampaignWorkspace
        campaign={campaign}
        locations={locations}
        members={members}
        invites={invites}
        history={history}
        stats={{
          totalBooths,
          submittedCount,
          approvedCount,
          pendingReviewsCount,
          missingStaffCount,
        }}
        isManager={isManager}
      />
    </div>
  );
}
