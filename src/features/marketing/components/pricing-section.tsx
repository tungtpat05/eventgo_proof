'use client';

import React from 'react';
import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslations } from 'next-intl';

export function PricingSection() {
  const t = useTranslations('marketing.pricing');

  const plans = [
    {
      name: t('freePlan'),
      price: t('freePrice'),
      desc: t('freeDesc'),
      highlighted: false,
      features: [
        t('featureCampaigns', { count: 1 }),
        t('featureBooths', { count: 10 }),
        t('featurePhotos'),
        t('featureReports'),
      ],
      buttonText: t('getStarted'),
      buttonVariant: 'outline' as const,
    },
    {
      name: t('starterPlan'),
      price: t('starterPrice'),
      desc: t('starterDesc'),
      highlighted: true,
      badge: 'Phổ biến nhất',
      features: [
        t('featureCampaigns', { count: 5 }),
        t('featureBooths', { count: 50 }),
        t('featurePhotos'),
        t('featureReports'),
        t('featureSupport'),
      ],
      buttonText: t('getStarted'),
      buttonVariant: 'default' as const,
    },
    {
      name: t('proPlan'),
      price: t('proPrice'),
      desc: t('proDesc'),
      highlighted: false,
      features: [
        t('featureCampaigns', { count: 20 }),
        t('featureBooths', { count: 200 }),
        t('featurePhotos'),
        t('featureReports'),
        t('featureSupport'),
      ],
      buttonText: t('getStarted'),
      buttonVariant: 'outline' as const,
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Bảng giá B2B</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
            <div
              key={idx}
              className={`rounded-2xl p-7 flex flex-col justify-between transition-all duration-200 relative ${
                plan.highlighted
                  ? 'bg-white border-2 border-blue-600 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/5'
                  : 'bg-white border border-slate-200/80 shadow-xs hover:shadow-md'
              }`}
            >
              {plan.badge && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[11px] font-bold px-3 py-0.5 rounded-full shadow-xs tracking-wide uppercase">
                  {plan.badge}
                </div>
              )}

              <div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {plan.name}
                </h3>
                <p className="text-xs text-slate-500 mb-5 min-h-[32px]">
                  {plan.desc}
                </p>

                <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-slate-100">
                  <span className="text-3xl sm:text-4xl font-extrabold text-slate-950">
                    {plan.price}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {t('perMonth')}
                  </span>
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, fIdx) => (
                    <li key={fIdx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <Link href="/login" className="w-full">
                <Button
                  variant={plan.buttonVariant}
                  className={`w-full font-semibold h-11 text-sm cursor-pointer ${
                    plan.highlighted
                      ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  {plan.buttonText}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

