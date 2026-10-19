import React from 'react';
import Link from 'next/link';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard,
  CreditCard,
  Receipt,
  ListChecks,
  UserCheck,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUserSession();

  // Guard: Must be system admin
  if (!session.user.isSystemAdmin) {
    redirect('/campaigns?error=Yêu cầu quyền Quản trị viên hệ thống');
  }

  const navItems = [
    { href: '/admin', label: 'Tổng quan', icon: LayoutDashboard },
    { href: '/admin/subscriptions', label: 'Quản lý Gói', icon: CreditCard },
    { href: '/admin/transactions', label: 'Giao dịch & Doanh thu', icon: Receipt },
    { href: '/admin/templates', label: 'Mẫu Checklist', icon: ListChecks },
    { href: '/admin/admins', label: 'Quản trị viên', icon: UserCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white shrink-0 flex flex-col justify-between border-r border-slate-800">
        <div>
          {/* Logo / Title */}
          <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-2.5">
            <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-sm">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-white block">EventGo Admin</span>
              <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-medium">Hệ Thống Quản Trị</span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs sm:text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/80 transition-colors"
                >
                  <Icon className="h-4 w-4 text-blue-400" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to Client App */}
        <div className="p-4 border-t border-slate-800">
          <Link
            href="/campaigns"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Quay lại trang Ứng dụng</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
              Admin Session
            </span>
            <span className="text-xs text-slate-500 hidden sm:inline">
              Đăng nhập: <strong>{session.user.fullName}</strong> ({session.user.email})
            </span>
          </div>

          <Link
            href="/settings/billing"
            className="text-xs font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            Xem cổng Billing
          </Link>
        </header>

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
