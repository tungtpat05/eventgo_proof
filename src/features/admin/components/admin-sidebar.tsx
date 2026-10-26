'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  Package,
  RefreshCw,
  Receipt,
  Landmark,
  ListChecks,
  UserCheck,
  ShieldCheck,
  ChevronDown,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminLayout } from '../context/admin-layout-context';
import { useTranslations } from 'next-intl';

export function AdminSidebar() {
  const pathname = usePathname();
  const t = useTranslations('admin.sidebar');
  const { sidebarOpen, closeSidebar } = useAdminLayout();
  const mobileDrawerRef = useRef<HTMLDivElement>(null);

  // Nhóm các route liên quan đến tiền & thanh toán
  const billingSubRoutes = [
    { href: '/admin/plans', label: t('plans'), icon: Package },
    { href: '/admin/subscriptions', label: t('subscriptions'), icon: RefreshCw },
    { href: '/admin/transactions', label: t('transactions'), icon: Receipt },
    { href: '/admin/payment-settings', label: t('paymentSettings'), icon: Landmark },
  ];

  const isBillingActive = billingSubRoutes.some((item) =>
    pathname.startsWith(item.href)
  );

  const [isBillingOpen, setIsBillingOpen] = useState(true);

  // Tự động mở submenu khi người dùng duyệt đến một trong các trang thuộc nhóm
  useEffect(() => {
    if (isBillingActive) {
      setIsBillingOpen(true);
    }
  }, [isBillingActive]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && sidebarOpen) {
        closeSidebar();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [sidebarOpen, closeSidebar]);

  const renderNavContent = (isMobile = false) => (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-900 text-white">
      {/* Logo / Title */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">EventGo Admin</span>
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">
              {t('systemSubtitle')}
            </span>
          </div>
        </div>
        {isMobile && (
          <button
            type="button"
            onClick={closeSidebar}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            aria-label={t('closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        {/* 1. Tổng quan */}
        <Link
          href="/admin/dashboard"
          onClick={() => isMobile && closeSidebar()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer',
            pathname === '/admin/dashboard' || pathname === '/admin'
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          )}
        >
          <LayoutDashboard
            className={cn(
              'h-4 w-4',
              pathname === '/admin/dashboard' || pathname === '/admin'
                ? 'text-white'
                : 'text-blue-400'
            )}
          />
          <span>{t('dashboard')}</span>
        </Link>

        {/* 2. Nhóm: Thanh toán & Gói dịch vụ (Collapsible Dropdown) */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setIsBillingOpen((prev) => !prev)}
            className={cn(
              'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors select-none cursor-pointer',
              isBillingActive
                ? 'text-white font-semibold bg-slate-800/50'
                : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
            )}
          >
            <div className="flex items-center gap-3">
              <Wallet className={cn('h-4 w-4', isBillingActive ? 'text-blue-400' : 'text-slate-400')} />
              <span>{t('billing')}</span>
            </div>
            <ChevronDown
              className={cn(
                'h-4 w-4 text-slate-400 transition-transform duration-200',
                isBillingOpen ? 'rotate-0' : '-rotate-90'
              )}
            />
          </button>

          {/* Submenu Items */}
          {isBillingOpen && (
            <div className="mt-1 pl-3 space-y-1 border-l-2 border-slate-800 ml-4">
              {billingSubRoutes.map((subItem) => {
                const SubIcon = subItem.icon;
                const isSubActive = pathname === subItem.href || pathname.startsWith(subItem.href + '/');

                return (
                  <Link
                    key={subItem.href}
                    href={subItem.href}
                    onClick={() => isMobile && closeSidebar()}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer',
                      isSubActive
                        ? 'bg-slate-800 text-white font-semibold shadow-xs ring-1 ring-slate-700/60'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                    )}
                  >
                    <SubIcon
                      className={cn(
                        'h-4 w-4 shrink-0',
                        isSubActive ? 'text-blue-400' : 'text-slate-400'
                      )}
                    />
                    <span>{subItem.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Mẫu Checklist */}
        <Link
          href="/admin/templates"
          onClick={() => isMobile && closeSidebar()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer',
            pathname.startsWith('/admin/templates')
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          )}
        >
          <ListChecks
            className={cn(
              'h-4 w-4',
              pathname.startsWith('/admin/templates') ? 'text-white' : 'text-blue-400'
            )}
          />
          <span>{t('checklistTemplates')}</span>
        </Link>

        {/* 4. Quản trị viên */}
        <Link
          href="/admin/admins"
          onClick={() => isMobile && closeSidebar()}
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors cursor-pointer',
            pathname.startsWith('/admin/admins')
              ? 'bg-blue-600 text-white font-semibold shadow-xs'
              : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
          )}
        >
          <UserCheck
            className={cn(
              'h-4 w-4',
              pathname.startsWith('/admin/admins') ? 'text-white' : 'text-blue-400'
            )}
          />
          <span>{t('admins')}</span>
        </Link>
      </nav>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800/80 shrink-0">
        <div className="rounded-xl bg-slate-800/60 p-2.5 text-xs text-slate-400 text-center border border-slate-700/50">
          {t('version', { version: 'v1.0 (Admin)' })}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* 1. Desktop Fixed Sidebar (Always visible on md screens) */}
      <aside className="hidden md:flex md:w-64 md:fixed md:inset-y-0 md:left-0 md:z-40 bg-slate-900 text-white shrink-0 flex-col justify-between border-r border-slate-800 md:h-screen">
        {renderNavContent(false)}
      </aside>

      {/* 2. Mobile Drawer Sidebar (Slide-in sheet on screens < md) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={t('adminMenu')}>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
            onClick={closeSidebar}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div
            ref={mobileDrawerRef}
            className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-slate-900 shadow-2xl flex flex-col z-50 transform transition-transform duration-300 ease-in-out animate-in slide-in-from-left"
          >
            {renderNavContent(true)}
          </div>
        </div>
      )}
    </>
  );
}
