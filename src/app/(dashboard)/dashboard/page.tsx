import React from 'react';
import Link from 'next/link';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { CampaignRole, CampaignStatus } from '@/domain/enums';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { DashboardCampaignConsole } from '@/features/campaigns/components/dashboard-campaign-console';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ClipboardCheck,
  Plus,
  BarChart3,
  Rocket,
  Users2,
  Clock,
  TrendingUp,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { cn } from '@/lib/utils';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('campaigns.dashboard');
  return { title: t('metaTitle') };
}

export default async function DashboardPage() {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    redirect('/login');
  }
  const user = session.user;
  const t = await getTranslations('campaigns.dashboard');

  const campaigns = await getCampaignsUseCase();
  const pendingReviews = await new SupabaseSubmissionRepository().findPendingReviews(user.id);

  const managed = campaigns.filter((c) => c.currentUserRole === CampaignRole.MANAGER);
  const supervised = campaigns.filter((c) => c.currentUserRole === CampaignRole.SUPERVISOR);
  const approving = campaigns.filter((c) => c.currentUserRole === CampaignRole.APPROVER);

  const activeCount = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length;
  const completedCount = campaigns.filter((c) => c.status === CampaignStatus.COMPLETED).length;
  const draftManaged = managed.filter((c) => c.status === CampaignStatus.DRAFT);

  const completionRate =
    campaigns.length > 0
      ? Math.round(((activeCount + completedCount) / campaigns.length) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* 1. Header & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            {t('greeting', { name: user.fullName })}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">{t('greetingSub')}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Link href="/reports">
            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-9 cursor-pointer border-slate-200">
              <BarChart3 className="h-4 w-4 text-slate-500" />
              <span>{t('btnReports')}</span>
            </Button>
          </Link>
          <Link href="/campaigns/new">
            <Button size="sm" className="gap-1.5 text-xs h-9 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer shadow-xs">
              <Plus className="h-4 w-4" />
              <span>{t('btnCreateCampaign')}</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Top-level SaaS Cockpit KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Tổng chiến dịch */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiTotalCampaigns')}</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{campaigns.length}</p>
              <p className="text-[11px] text-blue-600 font-medium mt-1">
                {t('kpiActiveCampaigns', { count: activeCount })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Rocket className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Phân bổ vai trò */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiMyRoles')}</p>
              <p className="text-2xl font-bold tracking-tight text-slate-900 mt-1">{managed.length + supervised.length + approving.length}</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {t('kpiRolesDetail', {
                  m: managed.length,
                  s: supervised.length,
                  a: approving.length,
                })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
              <Users2 className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Bài nộp chờ xử lý */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiPendingReviews')}</p>
              <p className={cn('text-2xl font-bold tracking-tight mt-1', pendingReviews.length > 0 ? 'text-amber-600' : 'text-slate-900')}>
                {pendingReviews.length}
              </p>
              <p className="text-[11px] font-medium mt-1">
                {pendingReviews.length > 0 ? (
                  <span className="text-amber-600 flex items-center gap-1 font-semibold">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                    {t('kpiPendingUrgent')}
                  </span>
                ) : (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {t('kpiAllClean')}
                  </span>
                )}
              </p>
            </div>
            <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', pendingReviews.length > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500')}>
              <Clock className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Tỷ lệ vận hành */}
        <Card className="border border-slate-200 shadow-2xs bg-white">
          <CardContent className="p-4 sm:p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-500">{t('kpiCompletionRate')}</p>
              <p className="text-2xl font-bold tracking-tight text-emerald-600 mt-1">{completionRate}%</p>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                {t('kpiRateDetail', { percent: completionRate })}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Action Required Center (Trung tâm tác vụ cần xử lý ngay) */}
      {(pendingReviews.length > 0 || draftManaged.length > 0) && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              {t('actionCenterTitle')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {pendingReviews.length > 0 && (
              <Card className="border-amber-300 bg-amber-50/50 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0 mt-0.5">
                      <ClipboardCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-950">
                        {t('pendingReviewsNotice', { count: pendingReviews.length })}
                      </p>
                      <p className="text-[11px] text-amber-800/80 mt-0.5">
                        Hình ảnh bằng chứng hiện trường đang chờ bạn thẩm định và phê duyệt.
                      </p>
                    </div>
                  </div>
                  <Link href="/campaigns/approvals" className="shrink-0">
                    <Button size="sm" className="h-8 text-xs bg-amber-600 hover:bg-amber-700 text-white font-medium gap-1 cursor-pointer">
                      <span>{t('openApprovalsBtn')}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}

            {draftManaged.length > 0 && (
              <Card className="border-blue-200 bg-blue-50/40 shadow-2xs">
                <CardContent className="p-4 flex items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-700 shrink-0 mt-0.5">
                      <Rocket className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-blue-950">
                        {t('actionDraftNotice', { count: draftManaged.length })}
                      </p>
                      <p className="text-[11px] text-blue-800/80 mt-0.5">
                        Hoàn tất cấu hình checklist và phân công nhân sự để kích hoạt chiến dịch.
                      </p>
                    </div>
                  </div>
                  <Link href={`/campaigns/${draftManaged[0].id}/wizard?step=${draftManaged[0].wizardStep || 1}`} className="shrink-0">
                    <Button size="sm" variant="outline" className="h-8 text-xs border-blue-300 text-blue-700 hover:bg-blue-100 font-medium gap-1 cursor-pointer">
                      <span>{t('actionDraftBtn')}</span>
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* 4. Interactive Campaign Console (Hub điều khiển chiến dịch) */}
      <section className="space-y-3 pt-2">
        <DashboardCampaignConsole campaigns={campaigns} />
      </section>
    </div>
  );
}
