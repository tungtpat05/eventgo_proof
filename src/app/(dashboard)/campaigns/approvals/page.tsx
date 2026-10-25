import React from 'react';
import Link from 'next/link';
import { getApprovalCampaignsUseCase } from '@/application/use-cases/campaigns/get-approval-campaigns';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCheck, Calendar, ArrowRight, Tag, Clock, LayoutDashboard, FolderKanban } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chiến Dịch Phê Duyệt Bằng Chứng',
  description: 'Danh sách các chiến dịch bạn được phân công làm Người phê duyệt (Approver)',
};

export default async function ApprovalCampaignsPage() {
  const session = await getCurrentUserSession();
  const campaigns = await getApprovalCampaignsUseCase();

  const subRepo = new SupabaseSubmissionRepository();
  const pendingSubmissions = session ? await subRepo.findPendingReviews(session.user.id) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <CheckCheck className="h-6 w-6 text-emerald-600" />
            Chiến Dịch Phê Duyệt Bằng Chứng
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Thẩm định ảnh chụp hiện trường, đối chiếu tiêu chuẩn checklist và phê duyệt kết quả nghiệm thu.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingSubmissions.length > 0 ? (
            <Badge className="bg-amber-100 text-amber-800 border-amber-300 gap-1.5 font-bold text-xs py-1">
              <Clock className="h-3.5 w-3.5 text-amber-600" />
              {pendingSubmissions.length} ảnh đang chờ duyệt
            </Badge>
          ) : (
            <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 font-medium">
              {campaigns.length} chiến dịch được phân công
            </Badge>
          )}
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center bg-white shadow-2xs max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 mb-4 border border-emerald-100">
            <CheckCheck className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Chưa có chiến dịch phê duyệt nào</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            Khi Quản lý chiến dịch (Manager) phân công bạn làm Người phê duyệt (Approver) cho các booth, chiến dịch sẽ hiển thị tại đây kèm số lượng ảnh cần duyệt.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 cursor-pointer">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Về Bảng điều khiển
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="sm" className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 cursor-pointer font-semibold">
                <FolderKanban className="h-3.5 w-3.5" />
                Xem tất cả chiến dịch
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((campaign) => {
            return (
              <Link
                key={campaign.id}
                href={`/campaigns/approvals/${campaign.id}`}
                className="block group cursor-pointer"
              >
                <Card className="h-full border-slate-200 transition-all duration-200 hover:shadow-md hover:border-emerald-300 rounded-2xl flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
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
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {campaign.description}
                      </p>
                    )}

                    {/* Operational badge */}
                    <div className="flex items-center justify-between text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                      <span className="font-semibold text-slate-700">Quyền phê duyệt</span>
                      <span className="text-emerald-600 font-bold">Thẩm định viên</span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
                      </div>
                      <span className="flex items-center gap-1 text-emerald-600 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                        Xem xét <ArrowRight className="h-3.5 w-3.5" />
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
