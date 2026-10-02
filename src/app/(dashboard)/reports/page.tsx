import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { getLocationsUseCase } from '@/application/use-cases/locations/get-locations';
import { ReportView } from '@/features/reports/components/report-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Báo Cáo Nghiệm Thu — EventGo Proof',
};

interface ReportsPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const { campaignId } = await searchParams;
  const campaigns = await getCampaignsUseCase();

  const selectedCampaign =
    campaigns.find((c) => c.id === campaignId) || campaigns[0] || null;

  if (!selectedCampaign) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
        <p className="text-sm font-semibold text-slate-700">Chưa có chiến dịch nào để lập biên bản báo cáo.</p>
      </div>
    );
  }

  const locations = await getLocationsUseCase(selectedCampaign.id);

  return <ReportView campaign={selectedCampaign} locations={locations} />;
}
