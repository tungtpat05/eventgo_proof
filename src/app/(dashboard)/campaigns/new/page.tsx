import React from 'react';
import { CampaignForm } from '@/features/campaigns/components/campaign-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo Chiến Dịch Mới — EventGo Proof',
};

export default function NewCampaignPage() {
  return <CampaignForm />;
}
