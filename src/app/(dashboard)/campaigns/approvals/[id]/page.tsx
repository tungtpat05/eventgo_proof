import React from 'react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { getCampaignDetailsUseCase } from '@/application/use-cases/campaigns/get-campaign-details';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { SupabaseChecklistRepository } from '@/infrastructure/repositories/supabase-checklist-repository';
import { SupabaseBoothRepository } from '@/infrastructure/repositories/supabase-booth-repository';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/shared/status-badge';
import { ArrowLeft, Tag, CheckCheck, Clock } from 'lucide-react';
import { ApprovalDetailQueue } from '@/features/approvals/components/approval-detail-queue';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('operations.approvals');
  return {
    title: t('detailMetaTitle'),
  };
}

interface ApprovalDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function ApprovalDetailPage({ params }: ApprovalDetailPageProps) {
  const t = await getTranslations('operations.approvals');
  const { id } = await params;
  const session = await getCurrentUserSession();
  if (!session) redirect('/login');

  let campaign;
  try {
    campaign = await getCampaignDetailsUseCase(id);
  } catch {
    notFound();
  }

  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from('campaign_members')
    .select('id, role, status')
    .eq('campaign_id', id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (!member || member.status !== 'ACTIVE' || member.role !== 'APPROVER') {
    notFound();
  }

  // Tìm tất cả booth mà approver này được phân công trong chiến dịch
  const { data: assignments } = await supabase
    .from('booth_approver_assignments')
    .select(`
      booth_id,
      booths(
        id, location_id, name, code, description, deadline, created_at, updated_at,
        locations(id, campaign_id, name, address, city)
      )
    `)
    .eq('approver_member_id', member.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const assignedBooths = (assignments || [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((a: any) => a.booths)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((b: any) => b && b.locations && b.locations.campaign_id === id);

  const boothIds = assignedBooths.map((b) => b.id);

  const subRepo = new SupabaseSubmissionRepository();
  const checklistRepo = new SupabaseChecklistRepository();
  const boothRepo = new SupabaseBoothRepository();

  // Load submissions for all assigned booths
  const allSubmissions = (
    await Promise.all(boothIds.map((bId) => subRepo.findByBooth(bId)))
  ).flat();

  // Load criteria & booth mapping
  const enrichedSubmissions = await Promise.all(
    allSubmissions.map(async (sub) => {
      const [booth, checklistItems] = await Promise.all([
        boothRepo.findById(sub.boothId),
        checklistRepo.findByBooth(sub.boothId),
      ]);
      const checklistItem = checklistItems.find((ci) => ci.id === sub.checklistItemId) || null;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assignedBoothObj = assignedBooths.find((b: any) => b.id === sub.boothId);
      const location = assignedBoothObj?.locations || null;

      return {
        submission: sub,
        booth,
        boothName: booth?.name || t('defaultBoothName'),
        checklistItem,
        location,
      };
    })
  );

  const pendingList = enrichedSubmissions.filter((s) => s.submission.status === 'SUBMITTED');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link href="/campaigns/approvals">
          <Button variant="ghost" size="sm" className="gap-1 text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            {t('btnBackToApprovals')}
          </Button>
        </Link>
      </div>

      {/* Campaign Banner Header */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded">
                <Tag className="h-3 w-3" />
                {campaign.brandName}
              </span>
              <StatusBadge status={campaign.status} />
              <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                <CheckCheck className="h-3 w-3" /> {t('roleBadge')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{campaign.title}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {t('detailAssignedBooths', { count: assignedBooths.length })}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-900 text-xs font-semibold">
              <Clock className="h-4 w-4 text-amber-600" />
              <span>{t('pendingSubmissionsBadge', { count: pendingList.length })}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filterable, Searchable, Paginated Approval Detail Queue */}
      <ApprovalDetailQueue
        campaignId={campaign.id}
        submissions={enrichedSubmissions}
      />
    </div>
  );
}
