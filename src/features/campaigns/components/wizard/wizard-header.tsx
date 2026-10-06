'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight, CheckCircle2 } from 'lucide-react';

interface WizardHeaderProps {
  campaignTitle?: string;
  isSaved?: boolean;
}

export function WizardHeader({
  campaignTitle,
  isSaved = true,
}: WizardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-blue-600 font-medium mb-1">
          <Link href="/campaigns" className="hover:underline">
            Chiến dịch quản lý
          </Link>
          <ChevronRight className="h-3 w-3 text-slate-400" />
          <span className="text-slate-500 truncate max-w-xs">
            {campaignTitle ? campaignTitle : 'Tạo chiến dịch mới'}
          </span>
        </div>

        {/* Title & Badge */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {campaignTitle ? `Thiết lập: ${campaignTitle}` : 'Tạo chiến dịch mới'}
          </h1>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
            <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
            Bản nháp
          </span>
        </div>

        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Hoàn thành các bước dưới đây để thiết lập chiến dịch.
        </p>
      </div>

      {/* Autosaved Indicator */}
      <div className="shrink-0 self-start sm:self-auto">
        <div className="inline-flex items-center gap-2 rounded-xl bg-emerald-50/80 px-3.5 py-2 text-xs font-semibold text-emerald-700 border border-emerald-200/80 shadow-2xs">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <div>
            <div className="leading-tight">{isSaved ? 'Đã lưu' : 'Đang lưu...'}</div>
            <div className="text-[10px] font-normal text-emerald-600/80">Tự động lưu bản nháp</div>
          </div>
        </div>
      </div>
    </div>
  );
}
