import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { CampaignRole } from '@/domain/enums';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { CampaignCard } from '@/features/campaigns/components/campaign-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ClipboardCheck } from 'lucide-react';
import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

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
  const managed = campaigns.filter((campaign) => campaign.currentUserRole === CampaignRole.MANAGER);
  const supervised = campaigns.filter((campaign) => campaign.currentUserRole === CampaignRole.SUPERVISOR);
  const approving = campaigns.filter((campaign) => campaign.currentUserRole === CampaignRole.APPROVER);

  const groups = [
    { title: t('groupManagedTitle'), campaigns: managed, empty: t('groupManagedEmpty') },
    { title: t('groupSupervisedTitle'), campaigns: supervised, empty: t('groupSupervisedEmpty') },
    { title: t('groupApprovingTitle'), campaigns: approving, empty: t('groupApprovingEmpty') },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {t('greeting', { name: user.fullName })}
          </h1>
          <p className="text-sm text-slate-500">{t('greetingSub')}</p>
        </div>
      </div>

      {pendingReviews.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ClipboardCheck className="h-5 w-5 text-amber-600" />
              {t('pendingReviewsNotice', { count: pendingReviews.length })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Link href="/campaigns/approvals">
              <Button size="sm" variant="outline" className="cursor-pointer font-medium">
                {t('openApprovalsBtn')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
        <section key={group.title} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{group.title}</h2>
            <span className="text-sm text-slate-500">{group.campaigns.length}</span>
          </div>
          {group.campaigns.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">
              {group.empty}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
              {group.campaigns.map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
}
