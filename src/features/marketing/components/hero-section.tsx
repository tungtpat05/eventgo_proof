'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, CheckCircle2, Shield, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { BoothPreviewCard } from './booth-preview-card';
import { useTranslations } from 'next-intl';

export function HeroSection() {
  const t = useTranslations('marketing.hero');
  const tStats = useTranslations('marketing.stats');

  return (
    <div className="relative overflow-hidden pt-4 pb-16 lg:pb-24">
      {/* Top Navigation */}
      <header className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 sm:mb-16">
        <div className="flex items-center justify-between h-16 border-b border-slate-200/60 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <span className="text-lg font-bold text-slate-900 leading-none">
                EventGo Proof
              </span>
              <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
                Nghiệm Thu Gian Hàng
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/login">
              <Button
                variant="outline"
                size="sm"
                className="font-medium text-slate-700 hover:text-slate-900"
              >
                {t('loginButton')}
              </Button>
            </Link>
            <Link href="/login" className="hidden sm:inline-block">
              <Button
                size="sm"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-xs"
              >
                {t('startFreeButton')}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy & CTAs */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold shadow-2xs">
              <Shield className="w-3.5 h-3.5" />
              <span>{t('badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15]">
              {t('title')}{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                {t('titleHighlight')}
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              {t('description')}
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
              <Link href="/login" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base h-12 px-7 flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <span>{t('startFreeButton')}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <a href="#demo-preview" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto h-12 px-6 text-slate-700 font-medium border-slate-200 hover:bg-slate-50 cursor-pointer"
                >
                  <Smartphone className="w-4 h-4 mr-1.5 text-slate-500" />
                  <span>{t('viewDemoButton')}</span>
                </Button>
              </a>
            </div>

            <p className="text-xs text-slate-400 pt-1">
              ✓ Không cần thẻ tín dụng • ✓ Miễn phí trải nghiệm • ✓ Cài đặt PWA tức thì
            </p>
          </div>

          {/* Right Column: Visual Interactive Mockup */}
          <div id="demo-preview" className="lg:col-span-5">
            <BoothPreviewCard />
          </div>
        </div>

        {/* Stats Row */}
        <div className="mt-16 sm:mt-20 pt-8 border-t border-slate-200/80 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">500+</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{tStats('campaignsTracked')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-blue-600">15,000+</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{tStats('boothsInspected')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-600">5x</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{tStats('approvalSpeed')}</div>
          </div>
          <div className="space-y-1">
            <div className="text-2xl sm:text-3xl font-extrabold text-indigo-600">100%</div>
            <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">{tStats('fraudReduction')}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

