import React from 'react';
import { notFound } from 'next/navigation';
import { getLocationDetailsUseCase } from '@/application/use-cases/locations/get-location-details';
import { getChecklistItemsUseCase } from '@/application/use-cases/checklists/get-checklist-items';
import { SupervisorSubmitForm } from '@/features/submissions/components/supervisor-submit-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Nộp Bằng Chứng Nghiệm Thu — EventGo Proof',
};

interface SubmitPageProps {
  params: Promise<{ id: string }>;
}

export default async function LocationSubmitPage({ params }: SubmitPageProps) {
  const { id } = await params;

  let location;
  let checklistItems;
  try {
    location = await getLocationDetailsUseCase(id);
    checklistItems = await getChecklistItemsUseCase(location.campaignId);
  } catch {
    notFound();
  }

  return <SupervisorSubmitForm location={location} checklistItems={checklistItems} />;
}
