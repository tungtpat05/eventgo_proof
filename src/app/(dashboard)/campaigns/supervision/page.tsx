import React from 'react';
import Link from 'next/link';
import { getSupervisionCampaignsUseCase } from '@/application/use-cases/campaigns/get-supervision-campaigns';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScanEye, Calendar, ArrowRight, Tag } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chiến Dịch Giám Sát — EventGo Proof',
};

export default async function SupervisionCampaignsPage() {
  const campaigns = await getSupervisionCampaignsUseCase();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Chiến Dịch Giám Sát</h1>
        <p className="text-sm text-slate-500">
          Danh sách các chiến dịch bạn được phân công làm Giám sát viên hiện trường (Supervisor)
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-600 mb-3">
            <ScanEye className="h-6 w-6" />
          </div>
          <h3 className="text-base font-semibold text-slate-900">Chưa có chiến dịch giám sát nào</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mt-1">
            Khi Quản lý chiến dịch (Manager) phân công bạn phụ trách gian hàng, chiến dịch sẽ xuất hiện tại đây.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/supervision/${campaign.id}`}
              className="block group"
            >
              <Card className="h-full border-slate-200 transition-all duration-200 hover:shadow-md hover:border-blue-300">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      <Tag className="h-3 w-3" />
                      {campaign.brandName}
                    </span>
                    <StatusBadge status={campaign.status} />
                  </div>
                  <CardTitle className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
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
                    <span className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform">
                      Vào việc <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
