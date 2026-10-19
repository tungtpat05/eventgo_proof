import React from 'react';
import { NewCampaignStep1 } from '@/features/campaigns/components/wizard/new-campaign-step1';
import { Metadata } from 'next';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Tạo Chiến Dịch Mới — EventGo Proof',
};

export default async function NewCampaignPage() {
  const { user } = await getCurrentUserSession();
  if (user.isSystemAdmin) {
    redirect('/admin');
  }

  return <NewCampaignStep1 />;
}
