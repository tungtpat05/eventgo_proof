import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { LocationForm } from '@/features/locations/components/location-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thêm Địa Điểm Mới — EventGo Proof',
};

interface NewLocationPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function NewLocationPage({ searchParams }: NewLocationPageProps) {
  const { campaignId } = await searchParams;
  const campaigns = await getCampaignsUseCase();

  return <LocationForm campaigns={campaigns} defaultCampaignId={campaignId} />;
}
