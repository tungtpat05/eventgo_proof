'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/domain/entities';
import { SubscriptionPlanTier } from '@/domain/enums';
import { signOutAction, switchPersonaViewAction } from '@/features/auth/actions/auth-actions';
import {
  User,
  LogOut,
  ChevronDown,
  UserCircle,
  CreditCard,
  ChevronRight,
  ShieldAlert,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HeaderProps {
  user?: UserProfile;
}

function getPlanBadgeInfo(plan?: string) {
  switch (plan) {
    case 'PRO':
    case SubscriptionPlanTier.PRO:
      return {
        label: 'Pro',
        className: 'bg-purple-100 text-purple-700 border-purple-200',
      };
    case 'STARTER':
    case SubscriptionPlanTier.STARTER:
      return {
        label: 'Starter',
        className: 'bg-blue-100 text-blue-700 border-blue-200',
      };
    default:
      return {
        label: 'Free',
        className: 'bg-slate-100 text-slate-700 border-slate-200',
      };
  }
}

function getClientBreadcrumb(pathname: string): { group?: string; groupHref?: string; title: string } {
  if (pathname === '/dashboard') {
    return { title: 'Tổng quan' };
  }
  if (pathname.startsWith('/campaigns/supervision')) {
    return { group: 'Chiến dịch', groupHref: '/campaigns', title: 'Giám sát hiện trường' };
  }
  if (pathname.startsWith('/campaigns/approvals')) {
    return { group: 'Chiến dịch', groupHref: '/campaigns', title: 'Phê duyệt bằng chứng' };
  }
  if (pathname.startsWith('/campaigns/new')) {
    return { group: 'Chiến dịch', groupHref: '/campaigns', title: 'Tạo chiến dịch mới' };
  }
  if (pathname.startsWith('/campaigns/')) {
    return { group: 'Chiến dịch', groupHref: '/campaigns', title: 'Chi tiết chiến dịch' };
  }
  if (pathname === '/campaigns') {
    return { title: 'Chiến dịch quản lý' };
  }
  if (pathname.startsWith('/settings/billing')) {
    return { group: 'Cài đặt', title: 'Gói dịch vụ & Thanh toán' };
  }
  if (pathname.startsWith('/account')) {
    return { group: 'Cài đặt', title: 'Thông tin tài khoản' };
  }
  return { title: 'EventGo Proof' };
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const breadcrumb = getClientBreadcrumb(pathname);
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const planInfo = getPlanBadgeInfo(user?.plan);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      {/* Breadcrumbs Navigation */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium min-w-0">
        {breadcrumb.group ? (
          <>
            {breadcrumb.groupHref ? (
              <Link
                href={breadcrumb.groupHref}
                className="text-slate-400 hover:text-slate-700 transition-colors shrink-0"
              >
                {breadcrumb.group}
              </Link>
            ) : (
              <span className="text-slate-400 select-none shrink-0">{breadcrumb.group}</span>
            )}
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" aria-hidden="true" />
            <span className="font-semibold text-slate-900 truncate">
              {breadcrumb.title}
            </span>
          </>
        ) : (
          <span className="font-semibold text-slate-900 truncate">
            {breadcrumb.title}
          </span>
        )}
      </nav>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Persona Switcher: If current user is a System Admin viewing Client Workspace */}
        {user?.isSystemAdmin && (
          <form action={() => switchPersonaViewAction('admin')}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 hover:text-amber-950 transition-colors shadow-xs cursor-pointer"
              title="Quay lại giao diện Quản trị hệ thống"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span className="hidden md:inline text-amber-700">Chế độ Khách hàng —</span>
              <span>Về Admin</span>
            </button>
          </form>
        )}

        {/* Quick link to Billing */}
        <Link
          href="/settings/billing"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Gói dịch vụ</span>
        </Link>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full py-1 px-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {user?.fullName && (
              <div className="hidden sm:flex flex-col items-end text-right">
                <span className="text-sm font-semibold text-slate-800 leading-tight">
                  {user.fullName}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none border mt-0.5',
                    planInfo.className
                  )}
                >
                  {planInfo.label}
                </span>
              </div>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold overflow-hidden">
              {user?.avatarUrl && !imgError ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName || 'User avatar'}
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4.5 w-4.5" />
              )}
            </div>
            <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-950/5 focus:outline-none z-50 divide-y divide-slate-100">
              {/* User profile summary */}
              <div className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-slate-900 truncate">
                    {user?.fullName || 'Người dùng'}
                  </p>
                  <span
                    className={cn(
                      'inline-flex items-center text-[10px] font-semibold px-1.5 py-0.5 rounded leading-none border',
                      planInfo.className
                    )}
                  >
                    Gói {planInfo.label}
                  </span>
                </div>
                {user?.email && (
                  <p className="text-[11px] text-slate-500 truncate mt-1">{user.email}</p>
                )}
                {user?.isSystemAdmin && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <ShieldCheck className="h-3 w-3 text-amber-600" />
                    Quản trị viên Hệ thống
                  </div>
                )}
              </div>

              {/* Action items */}
              <div className="py-1">
                {user?.isSystemAdmin && (
                  <form action={() => switchPersonaViewAction('admin')} className="w-full">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-semibold text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                    >
                      <ShieldCheck className="h-4 w-4 text-amber-600" />
                      Về Không gian Quản trị
                    </button>
                  </form>
                )}

                <Link
                  href="/account"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-slate-500" />
                  Thông tin tài khoản
                </Link>

                <Link
                  href="/settings/billing"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <CreditCard className="h-4 w-4 text-blue-600" />
                  Gói dịch vụ & Thanh toán
                </Link>
              </div>

              {/* Sign out */}
              <div className="py-1">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    Đăng xuất
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
