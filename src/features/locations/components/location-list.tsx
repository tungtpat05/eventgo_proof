'use client';

import React from 'react';
import Link from 'next/link';
import { Location } from '@/domain/entities';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';
import { MapPin, Calendar, Store, ArrowRight } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';

interface LocationListProps {
  locations: Location[];
}

export function LocationList({ locations }: LocationListProps) {
  const t = useTranslations('locations.list');
  const locale = useLocale();

  if (locations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center bg-white">
        <MapPin className="mx-auto h-8 w-8 text-slate-400 mb-2" />
        <p className="text-sm font-medium text-slate-700">{t('emptyTitle')}</p>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          {t('emptyDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {locations.map((loc) => (
        <div
          key={loc.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-2 mb-2">
              <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-700">
                {loc.city}
              </span>
            </div>

            <h3 className="font-bold text-slate-900 text-base line-clamp-1">{loc.name}</h3>
            <p className="text-xs text-slate-500 line-clamp-2 mt-1 flex items-start gap-1">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
              <span>{loc.address}</span>
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-500">
            {loc.deadline && (
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-slate-400" />
                <span>{t('deadline', { date: formatDate(loc.deadline, locale) })}</span>
              </div>
            )}

            <div className="flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Store className="h-3.5 w-3.5 text-slate-400" />
                {t('boothCount', { count: loc.booths?.length || 0 })}
              </span>

              <Link href={`/campaigns/${loc.campaignId}`}>
                <Button size="sm" variant="outline" className="text-xs h-8 px-2.5 flex items-center gap-1">
                  {t('btnViewDetail')}
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
