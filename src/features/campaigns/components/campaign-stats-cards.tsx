import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface CampaignStatsCardsProps {
  totalCampaigns: number;
  activeCampaigns: number;
  draftCampaigns: number;
  totalBooths: number;
  totalLocations: number;
}

export function CampaignStatsCards({
  totalCampaigns,
  activeCampaigns,
  draftCampaigns,
  totalBooths,
  totalLocations,
}: CampaignStatsCardsProps) {
  const currentYear = new Date().getFullYear();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tổng chiến dịch */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-slate-500">Tổng chiến dịch</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{totalCampaigns}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Trong năm {currentYear}</p>
        </CardContent>
      </Card>

      {/* 2. Đang hoạt động */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-slate-500">Đang hoạt động</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{activeCampaigns}</span>
          </div>
          {activeCampaigns > 0 ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Vận hành ổn định
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Chưa có chiến dịch chạy
            </div>
          )}
        </CardContent>
      </Card>

      {/* 3. Chờ thiết lập */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-slate-500">Chờ thiết lập</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{draftCampaigns}</span>
          </div>
          {draftCampaigns > 0 ? (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-amber-600 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              Cần tiếp tục hoàn thiện
            </div>
          ) : (
            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
              Không có bản nháp
            </div>
          )}
        </CardContent>
      </Card>

      {/* 4. Tổng số booth */}
      <Card className="border border-slate-200 shadow-xs bg-white">
        <CardContent className="p-5">
          <p className="text-xs font-medium text-slate-500">Tổng số booth</p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold tracking-tight text-slate-900">{totalBooths}</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">Tại {totalLocations} địa điểm</p>
        </CardContent>
      </Card>
    </div>
  );
}
