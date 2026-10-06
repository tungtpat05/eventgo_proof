import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCampaignWizardDataUseCase } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { CampaignWizard } from '@/features/campaigns/components/wizard/campaign-wizard';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thiết Lập Chiến Dịch — EventGo Proof',
};

interface WizardPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ step?: string }>;
}

export default async function CampaignWizardPage({
  params,
  searchParams,
}: WizardPageProps) {
  const { id } = await params;
  const { step } = await searchParams;

  const initialStep = step ? parseInt(step, 10) : 1;

  try {
    const wizardData = await getCampaignWizardDataUseCase(id);
    if (!wizardData) {
      notFound();
    }

    return (
      <CampaignWizard
        initialData={wizardData}
        initialStep={!isNaN(initialStep) ? initialStep : 1}
      />
    );
  } catch (err: any) {
    // If not manager or forbidden
    redirect('/campaigns');
  }
}
