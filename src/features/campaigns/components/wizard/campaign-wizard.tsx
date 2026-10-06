'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CampaignWizardData } from '@/application/use-cases/campaigns/get-campaign-wizard-data';
import { WizardHeader } from './wizard-header';
import { WizardStepper } from './wizard-stepper';
import { Step1Info } from './step-1-info';
import { Step2LocationsBooths } from './step-2-locations-booths';
import { Step3Checklists } from './step-3-checklists';
import { Step4Assignments } from './step-4-assignments';
import { Step5Review } from './step-5-review';
import { updateWizardStepAction } from '../../actions/campaign-wizard-actions';

interface CampaignWizardProps {
  initialData: CampaignWizardData;
  initialStep?: number;
}

export function CampaignWizard({ initialData, initialStep = 1 }: CampaignWizardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read step from URL searchParams or fallback to initialStep
  const stepParam = searchParams.get('step');
  const parsedStep = stepParam ? parseInt(stepParam, 10) : initialStep;
  const currentStep = !isNaN(parsedStep) && parsedStep >= 1 && parsedStep <= 5 ? parsedStep : 1;

  const [isSavedNotify, setIsSavedNotify] = useState(true);

  const setStep = (step: number) => {
    // Optimistically update URL
    const url = new URL(window.location.href);
    url.searchParams.set('step', String(step));
    router.push(url.pathname + url.search);

    // Persist step to database
    updateWizardStepAction(initialData.campaign.id, step).catch(() => {});
  };

  const handleAutoSaveNotify = () => {
    setIsSavedNotify(false);
    setTimeout(() => setIsSavedNotify(true), 800);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* 1. Header with Breadcrumb & Auto-save toast */}
      <WizardHeader
        campaignTitle={initialData.campaign.title}
        isSaved={isSavedNotify}
      />

      {/* 2. 5-Step Stepper Bar */}
      <WizardStepper
        currentStep={currentStep}
        onStepClick={(step) => setStep(step)}
        maxAccessibleStep={5}
      />

      {/* 3. Step Views */}
      {currentStep === 1 && (
        <Step1Info
          campaign={initialData.campaign}
          onNext={() => setStep(2)}
          onAutoSaveNotify={handleAutoSaveNotify}
        />
      )}

      {currentStep === 2 && (
        <Step2LocationsBooths
          campaign={initialData.campaign}
          locations={initialData.locations}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
          onAutoSaveNotify={handleAutoSaveNotify}
        />
      )}

      {currentStep === 3 && (
        <Step3Checklists
          campaign={initialData.campaign}
          locations={initialData.locations}
          allBooths={initialData.allBooths}
          templates={initialData.templates}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
          onAutoSaveNotify={handleAutoSaveNotify}
        />
      )}

      {currentStep === 4 && (
        <Step4Assignments
          campaign={initialData.campaign}
          locations={initialData.locations}
          supervisors={initialData.supervisors}
          approvers={initialData.approvers}
          onBack={() => setStep(3)}
          onNext={() => setStep(5)}
          onAutoSaveNotify={handleAutoSaveNotify}
        />
      )}

      {currentStep === 5 && (
        <Step5Review
          campaign={initialData.campaign}
          locations={initialData.locations}
          allBooths={initialData.allBooths}
          readiness={initialData.readiness}
          onBack={() => setStep(4)}
          onGoToStep={(step) => setStep(step)}
        />
      )}
    </div>
  );
}
