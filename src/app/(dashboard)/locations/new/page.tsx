import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { LocationForm } from '@/features/locations/components/location-form';
import { Metadata } from 'next';
import { CampaignRole } from '@/domain/enums';
import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.page');
  return {
    title: t('newMetaTitle'),
  };
}

interface NewLocationPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function NewLocationPage({ searchParams }: NewLocationPageProps) {
  const { campaignId } = await searchParams;
  const campaigns = (await getCampaignsUseCase()).filter((campaign) => campaign.currentUserRole === CampaignRole.MANAGER);
  if (campaignId && !campaigns.some((campaign) => campaign.id === campaignId)) notFound();
  if (campaigns.length === 0) notFound();

  return <LocationForm campaigns={campaigns} defaultCampaignId={campaignId} />;
}
