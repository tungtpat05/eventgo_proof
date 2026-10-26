'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/shared/language-switcher';

export default function NotFoundPage() {
  const t = useTranslations('errors.notFound');
  const tBrand = useTranslations('common.brand');

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <LanguageSwitcher />
      </div>

      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-xl space-y-6">
        {/* Brand Icon */}
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 shadow-sm">
          <ShieldCheck className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-bold uppercase tracking-wider">
            {t('badge')}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t('title')}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            {t('description')}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <Button className="w-full sm:w-auto text-xs font-semibold h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white gap-2 cursor-pointer shadow-xs">
              <Home className="h-4 w-4" />
              <span>{t('backDashboard')}</span>
            </Button>
          </Link>
          <Link href="/campaigns" className="w-full sm:w-auto">
            <Button variant="outline" className="w-full sm:w-auto text-xs font-semibold h-10 px-5 border-slate-200 text-slate-700 cursor-pointer">
              <span>{t('viewCampaigns')}</span>
            </Button>
          </Link>
        </div>
      </div>

      <p className="text-xs text-slate-400 mt-8">
        {tBrand('title')} — {tBrand('subtitle')}
      </p>
    </div>
  );
}
