'use client';

import React from 'react';
import { Camera, CheckCircle2, Layers, FileSpreadsheet } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FeatureGrid() {
  const t = useTranslations('marketing.features');

  const features = [
    {
      icon: Camera,
      title: t('f1Title'),
      desc: t('f1Desc'),
      color: 'bg-blue-50 text-blue-600 border-blue-200/80',
    },
    {
      icon: CheckCircle2,
      title: t('f2Title'),
      desc: t('f2Desc'),
      color: 'bg-emerald-50 text-emerald-600 border-emerald-200/80',
    },
    {
      icon: Layers,
      title: t('f3Title'),
      desc: t('f3Desc'),
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200/80',
    },
    {
      icon: FileSpreadsheet,
      title: t('f4Title'),
      desc: t('f4Desc'),
      color: 'bg-amber-50 text-amber-600 border-amber-200/80',
    },
  ];

  return (
    <section className="py-16 sm:py-24 bg-slate-100/60 border-y border-slate-200/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-base text-slate-600 leading-relaxed">
            {t('subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center border mb-5 ${feature.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

