import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { LocationImportView } from '@/features/locations/components/import-modal';
import { Metadata } from 'next';
import { CampaignRole } from '@/domain/enums';
import { notFound } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Import Danh Sách Địa Điểm — EventGo Proof',
};

interface ImportPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function LocationImportPage({ searchParams }: ImportPageProps) {
  const { campaignId } = await searchParams;
  const campaigns = (await getCampaignsUseCase()).filter((campaign) => campaign.currentUserRole === CampaignRole.MANAGER);
  if (campaignId && !campaigns.some((campaign) => campaign.id === campaignId)) notFound();
  const targetCampaignId = campaignId || campaigns[0]?.id || '';
  if (!targetCampaignId) notFound();

  return <LocationImportView campaignId={targetCampaignId} />;
}
