'use client';

import React from 'react';
import Link from 'next/link';
import { AlertCircle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

interface ExpirationWarningBannerProps {
  daysRemaining: number | null;
  isExpired: boolean;
  planName: string;
}

export function ExpirationWarningBanner({
  daysRemaining,
  isExpired,
  planName,
}: ExpirationWarningBannerProps) {
  const t = useTranslations('billing.expiration');

  if (daysRemaining === null) return null;
  if (!isExpired && (daysRemaining > 3 || daysRemaining <= 0)) return null;

  if (isExpired) {
    return (
      <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-800 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0" />
          <div>
            <p className="text-sm font-semibold">{t('expiredTitle', { plan: planName })}</p>
            <p className="text-xs text-red-700 mt-0.5">
              {t('expiredDesc')}
            </p>
          </div>
        </div>
        <Link href="/settings/billing">
          <Button size="sm" variant="destructive" className="text-xs gap-1.5 shrink-0">
            {t('renewNow')}
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
        <div>
          <p className="text-sm font-semibold">
            {t('warningTitle', { plan: planName, days: daysRemaining })}
          </p>
          <p className="text-xs text-amber-800 mt-0.5">
            {t('warningDesc')}
          </p>
        </div>
      </div>
      <Link href="/settings/billing">
        <Button size="sm" className="bg-amber-600 hover:bg-amber-700 text-white text-xs gap-1.5 shrink-0">
          {t('renewNow')}
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </Link>
    </div>
  );
}
