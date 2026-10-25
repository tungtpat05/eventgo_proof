import React from 'react';
import Link from 'next/link';
import { getSupervisionCampaignsUseCase } from '@/application/use-cases/campaigns/get-supervision-campaigns';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScanEye, Calendar, ArrowRight, Tag, MapPin, ShieldCheck, HelpCircle, LayoutDashboard } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chiến Dịch Giám Sát Hiện Trường',
  description: 'Danh sách các chiến dịch bạn được phân công làm Giám sát viên hiện trường (Supervisor)',
};

export default async function SupervisionCampaignsPage() {
  const campaigns = await getSupervisionCampaignsUseCase();

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <ScanEye className="h-6 w-6 text-blue-600" />
            Chiến Dịch Giám Sát Hiện Trường
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Các chiến dịch bạn được phân công phụ trách kiểm tra, chụp ảnh bằng chứng GPS và nghiệm thu booth.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs border-slate-200 text-slate-600 font-medium">
            {campaigns.length} chiến dịch được phân công
          </Badge>
        </div>
      </div>

      {campaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 p-10 sm:p-14 text-center bg-white shadow-2xs max-w-2xl mx-auto">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 mb-4 border border-blue-100">
            <ScanEye className="h-7 w-7" />
          </div>
          <h3 className="text-base font-bold text-slate-900">Chưa có chiến dịch giám sát nào</h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto mt-1.5 leading-relaxed">
            Khi Quản lý chiến dịch (Manager) thêm email của bạn vào danh sách Giám sát viên (Supervisor) của booth hoặc địa điểm, chiến dịch sẽ tự động hiển thị tại đây.
          </p>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" variant="outline" className="text-xs gap-1.5 cursor-pointer">
                <LayoutDashboard className="h-3.5 w-3.5" />
                Về Bảng điều khiển
              </Button>
            </Link>
            <Link href="/campaigns">
              <Button size="sm" className="text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1.5 cursor-pointer">
                Xem tất cả chiến dịch
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {campaigns.map((campaign) => (
            <Link
              key={campaign.id}
              href={`/campaigns/supervision/${campaign.id}`}
              className="block group cursor-pointer"
            >
              <Card className="h-full border-slate-200 transition-all duration-200 hover:shadow-md hover:border-blue-300 rounded-2xl flex flex-col justify-between">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
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
                    <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                      {campaign.description}
                    </p>
                  )}

                  {/* Operation metrics chip */}
                  <div className="flex items-center gap-2 text-[11px] text-slate-600 bg-slate-50 p-2 rounded-xl border border-slate-100">
                    <MapPin className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    <span className="font-medium">Nghiệm thu trực tiếp với định vị GPS</span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-400 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{formatDate(campaign.startDate)} – {formatDate(campaign.endDate)}</span>
                    </div>
                    <span className="flex items-center gap-1 text-blue-600 font-semibold group-hover:translate-x-0.5 transition-transform text-xs">
                      Vào việc <ArrowRight className="h-3.5 w-3.5" />
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
