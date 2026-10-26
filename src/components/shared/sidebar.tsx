'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  FolderKanban,
  ScanEye,
  CheckCheck,
  CheckCircle,
} from 'lucide-react';

export function Sidebar() {
  const pathname = usePathname();
  const t = useTranslations('common');

  const navigation = [
    {
      name: t('nav.dashboard'),
      href: '/dashboard',
      icon: CheckCircle,
      active: pathname === '/dashboard',
    },
    {
      name: t('nav.managedCampaigns'),
      href: '/campaigns',
      icon: FolderKanban,
      active:
        pathname === '/campaigns' ||
        pathname.startsWith('/campaigns/managed') ||
        (pathname.startsWith('/campaigns/') &&
          !pathname.startsWith('/campaigns/supervision') &&
          !pathname.startsWith('/campaigns/approvals')),
    },
    {
      name: t('nav.supervisionCampaigns'),
      href: '/campaigns/supervision',
      icon: ScanEye,
      active: pathname.startsWith('/campaigns/supervision'),
    },
    {
      name: t('nav.approvalCampaigns'),
      href: '/campaigns/approvals',
      icon: CheckCheck,
      active: pathname.startsWith('/campaigns/approvals'),
    },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r border-slate-200 bg-white">
        <div className="flex h-16 items-center gap-2.5 px-6 border-b border-slate-200 bg-white">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white font-bold shadow-sm">
            <CheckCircle className="h-5 w-5" />
          </div>
          <div>
            <span className="text-base font-bold text-slate-900 leading-none">
              {t('brand.title')}
            </span>
            <span className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider mt-0.5">
              {t('brand.subtitle')}
            </span>
          </div>
        </div>

        <div className="px-4 pt-4 pb-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            {t('nav.managedCampaigns')}
          </p>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-1 overflow-y-auto">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150',
                  item.active
                    ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon
                  className={cn(
                    'h-4 w-4',
                    item.active ? 'text-blue-600' : 'text-slate-400 group-hover:text-slate-500'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500 text-center">
            EventGo Proof <span className="font-semibold text-slate-700">v1.0</span>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar (Optimized for Field Staff) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-slate-200 shadow-lg px-2 py-1 flex justify-around">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center py-1 px-2 rounded-md text-[10px] font-medium transition-colors',
                item.active ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
              )}
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.name}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
}
