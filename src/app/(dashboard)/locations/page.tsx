import React from 'react';
import Link from 'next/link';
import { getLocationsUseCase } from '@/application/use-cases/locations/get-locations';
import { getCampaignsUseCase } from '@/application/use-cases/campaigns/get-campaigns';
import { LocationList } from '@/features/locations/components/location-list';
import { Button } from '@/components/ui/button';
import { PlusCircle, FileSpreadsheet } from 'lucide-react';
import { Metadata } from 'next';
import { CampaignRole } from '@/domain/enums';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('locations.page');
  return {
    title: t('metaTitle'),
  };
}

interface LocationsPageProps {
  searchParams: Promise<{ campaignId?: string }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const t = await getTranslations('locations.page');
  const { campaignId } = await searchParams;
  const [locations, campaigns] = await Promise.all([
    getLocationsUseCase(campaignId),
    getCampaignsUseCase(),
  ]);

  const selectedCampaign = campaigns.find((c) => c.id === campaignId);
  const canManage = selectedCampaign
    ? selectedCampaign.currentUserRole === CampaignRole.MANAGER
    : campaigns.some((campaign) => campaign.currentUserRole === CampaignRole.MANAGER);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t('pageTitle')}</h1>
          <p className="text-sm text-slate-500">
            {selectedCampaign
              ? t('campaignSubtitle', { title: selectedCampaign.title })
              : t('accessibleSubtitle')}
          </p>
        </div>

        {canManage && <div className="flex items-center gap-2">
          <Link href={campaignId ? `/locations/import?campaignId=${campaignId}` : '/locations/import'}>
            <Button variant="secondary" className="flex items-center gap-1.5 text-xs">
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
              {t('btnImport')}
            </Button>
          </Link>

          <Link href={campaignId ? `/locations/new?campaignId=${campaignId}` : '/locations/new'}>
            <Button className="flex items-center gap-1.5 text-xs">
              <PlusCircle className="h-4 w-4" />
              {t('btnCreate')}
            </Button>
          </Link>
        </div>}
      </div>

      <LocationList locations={locations} />
    </div>
  );
}
