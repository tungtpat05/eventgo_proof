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
    // Không nuốt lỗi điều hướng nội bộ của Next.js (notFound hoặc redirect)
    if (err && typeof err === 'object' && 'digest' in err) {
      throw err;
    }

    console.error('Wizard error for campaign', id, ':', err);
    const isAuthError = err?.name === 'AuthorizationError' || err?.message?.toLowerCase().includes('quyền') || err?.message?.toLowerCase().includes('forbidden');
    redirect(`/campaigns/managed?error=${encodeURIComponent(isAuthError ? 'Bạn không có quyền quản lý chiến dịch này.' : 'Không thể tải dữ liệu thiết lập chiến dịch.')}`);
  }
}
