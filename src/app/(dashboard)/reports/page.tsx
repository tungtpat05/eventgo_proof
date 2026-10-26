import React from 'react';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { getLocationsUseCase } from '@/application/use-cases/locations/get-locations';
import { ReportView, LocationAuditStat } from '@/features/reports/components/report-view';
import { createServerSupabaseClient } from '@/infrastructure/supabase/server';
import { SubmissionStatus } from '@/domain/enums';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('reports.page');
  return {
    title: t('metaTitle'),
  };
}

interface ReportsPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const t = await getTranslations('reports.page');
  const { campaignId } = await searchParams;
  const campaigns = await getCampaignsUseCase();

  const selectedCampaign =
    campaigns.find((c) => c.id === campaignId) || campaigns[0] || null;

  if (!selectedCampaign) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-12 text-center bg-white">
        <p className="text-sm font-semibold text-slate-700">{t('empty')}</p>
      </div>
    );
  }

  const locations = await getLocationsUseCase(selectedCampaign.id);

  // Calculate real audit criteria and completion status for each location
  const locationStats: Record<string, LocationAuditStat> = {};
  const locationIds = locations.map((l) => l.id);

  if (locationIds.length > 0) {
    const supabase = await createServerSupabaseClient();
    const { data: booths } = await supabase
      .from('booths')
      .select('id, location_id')
      .in('location_id', locationIds);

    const boothList = booths || [];
    const boothIds = boothList.map((b) => b.id);
    const boothToLocation = new Map(boothList.map((b) => [b.id, b.location_id]));

    const [{ data: checklists }, { data: approvedSubmissions }] = await Promise.all([
      boothIds.length > 0
        ? supabase.from('checklist_items').select('id, booth_id').in('booth_id', boothIds)
        : Promise.resolve({ data: [] }),
      boothIds.length > 0
        ? supabase.from('submissions').select('id, booth_id, status').in('booth_id', boothIds).eq('status', SubmissionStatus.APPROVED)
        : Promise.resolve({ data: [] }),
    ]);

    const checklistCounts: Record<string, number> = {};
    const approvedCounts: Record<string, number> = {};

    (checklists || []).forEach((c) => {
      const locId = boothToLocation.get(c.booth_id);
      if (locId) {
        checklistCounts[locId] = (checklistCounts[locId] || 0) + 1;
      }
    });

    (approvedSubmissions || []).forEach((s) => {
      const locId = boothToLocation.get(s.booth_id);
      if (locId) {
        approvedCounts[locId] = (approvedCounts[locId] || 0) + 1;
      }
    });

    locations.forEach((loc) => {
      locationStats[loc.id] = {
        totalChecklists: checklistCounts[loc.id] || 0,
        approvedCount: approvedCounts[loc.id] || 0,
        boothCount: boothList.filter((b) => b.location_id === loc.id).length,
      };
    });
  }

  return <ReportView campaign={selectedCampaign} locations={locations} locationStats={locationStats} />;
}
