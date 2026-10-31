'use client';

import React from 'react';
import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

export function MarketingFooter() {
  const t = useTranslations('marketing.footer');

  return (
    <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-xs">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <div>
              <span className="text-base font-bold text-white leading-none">
                EventGo Proof
              </span>
              <span className="block text-[10px] font-medium text-slate-500 uppercase tracking-wider mt-0.5">
                B2B SaaS Acceptance Platform
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 text-xs text-slate-400">
            <Link href="/login" className="hover:text-white transition-colors">
              Đăng nhập
            </Link>
            <Link href="/login" className="hover:text-white transition-colors">
              Dùng thử miễn phí
            </Link>
            <a href="#demo-preview" className="hover:text-white transition-colors">
              Mô phỏng quy trình
            </a>
          </div>
        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <p>
            © {new Date().getFullYear()} EventGo Proof. {t('rightsReserved')}
          </p>
          <p className="text-[11px] text-slate-600">
            PWA Enabled • Offline Shell • Next.js 16 App Router
          </p>
        </div>
      </div>
    </footer>
  );
}

