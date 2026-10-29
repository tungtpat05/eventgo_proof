import React from 'react';
import Link from 'next/link';
import { getApprovalCampaignsUseCase } from '@/application/use-cases/campaigns/get-approval-campaigns';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Clock, LayoutDashboard } from 'lucide-react';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ApprovalCampaignList } from '@/features/campaigns/components/approval-campaign-list';
import { CampaignRole, CampaignMemberStatus } from '@/domain/enums';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('operations.approvals');
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
  };
}

export default async function ApprovalCampaignsPage() {
  const t = await getTranslations('operations.approvals');
  const session = await getCurrentUserSession();
  const campaigns = await getApprovalCampaignsUseCase();

  const subRepo = new SupabaseSubmissionRepository();
  const pendingSubmissions = session ? await subRepo.findPendingReviews(session.user.id) : [];

  const pendingByCampaign: Record<string, number> = {};
  if (session?.user && campaigns.length > 0) {
    const supabase = await createServerSupabaseClient();
    const { data: memberships } = await supabase
      .from('campaign_members')
      .select('id, campaign_id')
      .eq('user_id', session.user.id)
      .eq('role', CampaignRole.APPROVER)
      .eq('status', CampaignMemberStatus.ACTIVE);

    const memberToCampaign = new Map((memberships || []).map((m) => [m.id, m.campaign_id]));
    (pendingSubmissions || []).forEach((sub) => {
      const campId = memberToCampaign.get(sub.assignedApproverMemberId);
      if (campId) {
        pendingByCampaign[campId] = (pendingByCampaign[campId] || 0) + 1;
      }
    });
  }

  const items = campaigns.map((c) => ({
    ...c,
    pendingReviewsCount: pendingByCampaign[c.id] || 0,
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckCheck className="h-6 w-6 text-emerald-600" />
            {t('pageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            {t('pageSubtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingSubmissions.length > 0 ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1.5 font-bold text-xs py-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              {t('pendingBadge', { count: pendingSubmissions.length })}
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 font-medium">
              {t('assignedCountBadge', { count: campaigns.length })}
            </Badge>
          )}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center bg-white shadow-2xs max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
            <CheckCheck className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">{t('emptyTitle')}</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            {t('emptyDesc')}
          </p>

          <div className="mt-6 flex items-center justify-center">
            <Link href="/dashboard">
              <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer font-medium px-4 h-9 shadow-xs">
                <LayoutDashboard className="h-4 w-4" />
                {t('btnBackDashboard')}
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <ApprovalCampaignList campaigns={items} />
      )}
    </div>
  );
}
