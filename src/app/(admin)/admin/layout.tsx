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
  ShieldCheck,
} from 'lucide-react';
import { AdminHeader } from '@/features/admin/components/admin-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUserSession();

  // Guard: Must be system admin
  if (!session.user.isSystemAdmin) {
    redirect('/dashboard');
  }

  const navItems = [
    { href: '/admin/dashboard', label: 'Tổng quan', icon: LayoutDashboard },
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

      </aside>

      {/* Main Admin Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader user={session.user} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
