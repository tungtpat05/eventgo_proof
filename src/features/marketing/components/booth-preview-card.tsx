'use client';

import React from 'react';
import { Camera, CheckCircle2, ShieldCheck, MapPin, UserCheck, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function BoothPreviewCard() {
  const t = useTranslations('marketing.evidenceDemo');

  return (
    <div className="relative mx-auto max-w-lg w-full rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50 overflow-hidden">
      {/* Top Header Mockup */}
      <div className="bg-slate-900 text-white px-5 py-3.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold tracking-wide uppercase text-slate-300">
            {t('tag')}
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full font-medium border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{t('statusVerified')}</span>
        </div>
      </div>

      {/* Booth Body */}
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h4 className="font-bold text-slate-900 text-base flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
              {t('boothName')}
            </h4>
            <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
              <span className="flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                {t('supervisorName')}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                {t('timestamp')}
              </span>
            </div>
          </div>
        </div>

        {/* Photo Preview Mockup */}
        <div className="relative aspect-video rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200/80 overflow-hidden flex items-center justify-center group shadow-inner">
          <div className="absolute inset-0 bg-radial from-transparent to-black/20 pointer-events-none" />
          
          {/* Simulated Booth Visual Elements */}
          <div className="text-center p-4">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white mx-auto flex items-center justify-center shadow-md mb-2">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-xs font-medium text-slate-700">
              {t('checklistItem')}
            </p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              1600x1200px • 1.2MB • JPEG 0.85 Client Compressed
            </p>
          </div>

          <div className="absolute bottom-3 left-3 bg-black/75 backdrop-blur-xs text-white text-[11px] px-2.5 py-1 rounded-md flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Chống gian lận: Camera thiết bị trực tiếp</span>
          </div>
        </div>

        {/* Checklist item verified badge */}
        <div className="rounded-lg bg-emerald-50/80 border border-emerald-200/60 p-3 flex items-center justify-between text-xs text-emerald-900">
          <span className="font-medium">100% Tiêu chí tuân thủ đã phê duyệt</span>
          <span className="text-emerald-700 font-bold">5 / 5 Checklist Đạt</span>
        </div>
      </div>
    </div>
  );
}

