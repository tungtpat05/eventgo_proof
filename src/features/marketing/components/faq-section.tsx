'use client';

import React from 'react';
import { HelpCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function FaqSection() {
  const t = useTranslations('marketing.faq');

  const faqs = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
    { q: t('q3'), a: t('a3') },
  ];

  return (
    <section className="py-16 sm:py-20 bg-slate-50 border-t border-slate-200/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-200/60 text-slate-700 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hỏi đáp</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-950 tracking-tight">
            {t('title')}
          </h2>
          <p className="text-sm text-slate-600">
            {t('subtitle')}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-2xs space-y-2"
            >
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                {faq.q}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

