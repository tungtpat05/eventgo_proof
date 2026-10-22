'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function AdminSidebar() {
  const pathname = usePathname();

  // Nhóm các route liên quan đến tiền & thanh toán
  const billingSubRoutes = [
    { href: '/admin/plans', label: 'Gói dịch vụ', icon: Package },
    { href: '/admin/subscriptions', label: 'Quản lý đăng ký', icon: RefreshCw },
    { href: '/admin/transactions', label: 'Lịch sử giao dịch', icon: Receipt },
    { href: '/admin/payment-settings', label: 'Cấu hình nhận tiền', icon: Landmark },
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

  return (
    <aside className="w-full md:w-64 md:fixed md:inset-y-0 md:left-0 md:z-40 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800 md:h-screen">
      <div className="flex-1 flex flex-col min-h-0">
        {/* Logo / Title */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5 shrink-0">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <span className="font-bold text-sm tracking-tight text-white block">EventGo Admin</span>
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">
              Hệ Thống Quản Trị
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
          {/* 1. Tổng quan */}
          <Link
            href="/admin/dashboard"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
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
            <span>Tổng quan</span>
          </Link>

          {/* 2. Nhóm: Thanh toán & Gói dịch vụ (Collapsible Dropdown) */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIsBillingOpen((prev) => !prev)}
              className={cn(
                'w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors select-none',
                isBillingActive
                  ? 'text-white font-semibold bg-slate-800/50'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
              )}
            >
              <div className="flex items-center gap-3">
                <Wallet className={cn('h-4 w-4', isBillingActive ? 'text-blue-400' : 'text-slate-400')} />
                <span>Thanh toán</span>
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
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-xl text-xs sm:text-sm font-medium transition-colors',
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
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
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
            <span>Mẫu Checklist</span>
          </Link>

          {/* 4. Quản trị viên */}
          <Link
            href="/admin/admins"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
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
            <span>Quản trị viên</span>
          </Link>
        </nav>
      </div>

      {/* Footer / System Status */}
      <div className="p-4 border-t border-slate-800/80 shrink-0">
        <div className="rounded-xl bg-slate-800/60 p-2.5 text-xs text-slate-400 text-center border border-slate-700/50">
          Phiên bản <span className="font-semibold text-slate-200">v1.0 (Admin)</span>
        </div>
      </div>
    </aside>
  );
}
