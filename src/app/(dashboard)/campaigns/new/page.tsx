import React from 'react';
import { NewCampaignStep1 } from '@/features/campaigns/components/wizard/new-campaign-step1';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tạo Chiến Dịch Mới — EventGo Proof',
};

export default function NewCampaignPage() {
  return <NewCampaignStep1 />;
}
