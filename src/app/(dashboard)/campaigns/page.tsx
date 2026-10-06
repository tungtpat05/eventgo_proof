import React from 'react';
import Link from 'next/link';
import { getManagedCampaignsWithProgressUseCase } from '@/application/use-cases/campaigns/get-managed-campaigns-with-progress';
import { CampaignStatsCards } from '@/features/campaigns/components/campaign-stats-cards';
import { CampaignTable } from '@/features/campaigns/components/campaign-table';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Metadata } from 'next';
import { CampaignStatus } from '@/domain/enums';

export const metadata: Metadata = {
  title: 'Chiến Dịch Quản Lý — EventGo Proof',
};

export default async function ManagedCampaignsPage() {
  const campaigns = await getManagedCampaignsWithProgressUseCase();

  // Calculate aggregated stats
  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === CampaignStatus.ACTIVE).length;
  const draftCampaigns = campaigns.filter((c) => c.status === CampaignStatus.DRAFT).length;
  const totalBooths = campaigns.reduce((acc, c) => acc + c.boothCount, 0);
  const totalLocations = campaigns.reduce((acc, c) => acc + c.locationCount, 0);

  return (
    <div className="space-y-6">
      {/* 1. Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">
            Quản lý chiến dịch
          </span>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 mt-0.5">
            Chiến dịch quản lý
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Theo dõi tiến độ thiết lập và vận hành các chiến dịch của bạn.
          </p>
        </div>

        <Link href="/campaigns/new">
          <Button className="flex items-center gap-1.5 shadow-sm bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold h-10 px-4">
            <Plus className="h-4 w-4" />
            Tạo chiến dịch
          </Button>
        </Link>
      </div>

      {/* 2. KPI Stat Cards */}
      <CampaignStatsCards
        totalCampaigns={totalCampaigns}
        activeCampaigns={activeCampaigns}
        draftCampaigns={draftCampaigns}
        totalBooths={totalBooths}
        totalLocations={totalLocations}
      />

      {/* 3. Campaign Table & Filter Toolbar */}
      <CampaignTable campaigns={campaigns} />
    </div>
  );
}
