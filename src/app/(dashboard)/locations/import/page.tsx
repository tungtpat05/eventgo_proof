import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { LocationImportView } from '@/features/locations/components/import-modal';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Import Danh Sách Địa Điểm — EventGo Proof',
};

interface ImportPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function LocationImportPage({ searchParams }: ImportPageProps) {
  const { campaignId } = await searchParams;
  const campaigns = await getCampaignsUseCase();
  const targetCampaignId = campaignId || campaigns[0]?.id || '';

  return <LocationImportView campaignId={targetCampaignId} />;
}
