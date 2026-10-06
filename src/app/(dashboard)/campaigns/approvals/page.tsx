import React from 'react';
import Link from 'next/link';
import { getApprovalCampaignsUseCase } from '@/application/use-cases/campaigns/get-approval-campaigns';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CheckCheck, Calendar, ArrowRight, Tag, Clock } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chiến Dịch Phê Duyệt — EventGo Proof',
};

export default async function ApprovalCampaignsPage() {
  const session = await getCurrentUserSession();
  const campaigns = await getApprovalCampaignsUseCase();

  const subRepo = new SupabaseSubmissionRepository();
  const pendingSubmissions = session ? await subRepo.findPendingReviews(session.user.id) : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chiến Dịch Phê Duyệt</h1>
        <p className="text-sm text-slate-500">
          Danh sách các chiến dịch bạn được phân công làm Người phê duyệt (Approver)
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 mb-3">
            <CheckCheck className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Chưa có chiến dịch phê duyệt nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Khi Quản lý chiến dịch (Manager) phân công bạn duyệt gian hàng, chiến dịch sẽ hiển thị tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => {
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/approvals/${campaign.id}`}
                className="block group"
              >
                <Card className="h-full border-slate-200 transition-all duration-200 hover:shadow-md hover:border-emerald-300">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        <Tag className="h-3 w-3" />
                        {campaign.brandName}
                      </span>
                      <StatusBadge status={campaign.status} />
                    </div>
                    <CardTitle className="text-base font-bold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-1">
                      {campaign.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {campaign.description && (
                      <p className="text-xs text-slate-500 line-clamp-2">{campaign.description}</p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
                      </div>
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                        Xem xét <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
