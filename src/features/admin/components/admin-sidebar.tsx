'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  ListChecks,
  UserCheck,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
  { href: '/admin/subscriptions', label: 'Quản lý Gói', icon: CreditCard },
  { href: '/admin/transactions', label: 'Giao dịch & Doanh thu', icon: Receipt },
  { href: '/admin/templates', label: 'Mẫu Checklist', icon: ListChecks },
  { href: '/admin/admins', label: 'Quản trị viên', icon: UserCheck },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
      <div>
        {/* Logo / Title */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
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

        {/* Navigation Links with Active State */}
        <nav className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/admin/dashboard'
                ? pathname === '/admin/dashboard' || pathname === '/admin'
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
                )}
              >
                <Icon className={cn('h-4 w-4', isActive ? 'text-white' : 'text-blue-400')} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
