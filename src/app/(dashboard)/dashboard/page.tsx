import React from 'react';
import Link from 'next/link';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { getLocationsUseCase } from '@/application/use-cases/locations/get-locations';
import { SupabaseSubmissionRepository } from '@/infrastructure/repositories/supabase-submission-repository';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { KpiCard } from '@/features/dashboard/components/kpi-card';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CampaignStatus, SubmissionStatus } from '@/domain/enums';
import { formatDate } from '@/lib/utils';
import {
  Megaphone,
  MapPin,
  Clock,
  AlertTriangle,
  CheckCircle2,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Bảng Điều Khiển — EventGo Proof',
};

export default async function DashboardPage() {
  const session = await getCurrentUserSession();
  const subRepo = new SupabaseSubmissionRepository();

  const [campaigns, locations, pendingReviews] = await Promise.all([
    getCampaignsUseCase(),
    getLocationsUseCase(),
    subRepo.findPendingReviews(session.user.organizationId),
  ]);

  const activeCampaigns = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE);
  const totalCampaigns = campaigns.length;
  const totalLocations = locations.length;
  const pendingApprovalsCount = pendingReviews.length;

  return (
    <div className="space-y-8">
      {/* Top Welcome Header & Fast Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Xin chào, {session.user.fullName} 👋
          </h1>
          <p className="text-sm text-slate-500">
            Hệ thống giám sát và nghiệm thu chiến dịch gian hàng — {session.organizationName}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/locations/import">
            <Button variant="secondary" size="sm" className="flex items-center gap-1.5 text-xs">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              Import Excel
            </Button>
          </Link>

          <Link href="/campaigns/new">
            <Button size="sm" className="flex items-center gap-1.5 text-xs">
              <PlusCircle className="h-4 w-4" />
              Tạo chiến dịch mới
            </Button>
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Chiến dịch đang chạy"
          value={activeCampaigns.length}
          description={`Tổng số ${totalCampaigns} chiến dịch đã tạo`}
          icon={Megaphone}
          colorVariant="blue"
        />

        <KpiCard
          title="Địa điểm kích hoạt"
          value={totalLocations}
          description="Đang giám sát nghiệm thu trên toàn quốc"
          icon={MapPin}
          colorVariant="purple"
        />

        <KpiCard
          title="Hồ sơ chờ phê duyệt"
          value={pendingApprovalsCount}
          description="Cần người kiểm duyệt đánh giá"
          icon={Clock}
          colorVariant="amber"
        />

        <KpiCard
          title="Cần chụp lại / Sửa"
          value="1"
          description="Có phản hồi yêu cầu giám sát bổ sung"
          icon={AlertTriangle}
          colorVariant="red"
        />
      </div>

      {/* Main Campaign Progress & Quick Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Campaigns Progress Table */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Tiến Độ Các Chiến Dịch Trọng Điểm
              </CardTitle>
            </div>
            <Link href="/campaigns">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                Xem tất cả ({campaigns.length})
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaigns.map((camp) => (
              <div
                key={camp.id}
                className="rounded-xl border border-slate-100 bg-slate-50/50 p-4 space-y-3 hover:bg-slate-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                      {camp.brandName}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{camp.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Thời gian: {formatDate(camp.startDate)} — {formatDate(camp.endDate)}
                    </p>
                  </div>
                  <Link href={`/campaigns/${camp.id}`}>
                    <Button variant="outline" size="sm" className="text-xs h-8">
                      Chi tiết
                    </Button>
                  </Link>
                </div>

                {/* Simulated Progress Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Tỷ lệ hoàn thành nghiệm thu gian hàng</span>
                    <span className="font-bold text-slate-900">
                      {camp.status === CampaignStatus.ACTIVE ? '60%' : '10%'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        camp.status === CampaignStatus.ACTIVE ? 'bg-blue-600 w-[60%]' : 'bg-slate-400 w-[10%]'
                      }`}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Pending Approvals Quick Column */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              <CardTitle className="text-base font-bold text-slate-900">
                Chờ Duyệt Gấp
              </CardTitle>
            </div>
            <Link href="/approvals">
              <Button variant="ghost" size="sm" className="text-xs text-blue-600">
                Tất cả ({pendingApprovalsCount})
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingApprovalsCount === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-500 mb-1" />
                Không có hồ sơ nào đang chờ duyệt.
              </div>
            ) : (
              pendingReviews.slice(0, 3).map((sub) => (
                <div key={sub.id} className="rounded-lg border border-slate-200 p-3 text-xs space-y-1">
                  <div className="flex items-center justify-between font-semibold text-slate-900">
                    <span>Hồ sơ #{sub.id.substring(0, 8)}</span>
                    <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded text-[10px]">
                      Chờ duyệt
                    </span>
                  </div>
                  <p className="text-slate-500 line-clamp-1">{sub.notes || 'Bằng chứng nghiệm thu hiện trường'}</p>
                  <div className="pt-2 flex justify-end">
                    <Link href="/approvals">
                      <Button size="sm" variant="outline" className="text-xs h-7 px-2">
                        Kiểm tra ngay
                      </Button>
                    </Link>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
