import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { LocationImportView } from '@/features/locations/components/import-modal';
import { Metadata } from 'next';
import { CampaignRole } from '@/domain/enums';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.page');
  return {
    title: t('importMetaTitle'),
  };
}

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
