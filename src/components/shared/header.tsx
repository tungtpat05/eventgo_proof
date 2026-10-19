'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/domain/entities';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { User, LogOut, ChevronDown, UserCircle, CreditCard, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  user?: UserProfile;
}

export function Header({ user }: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-3">
        {/* Quick link to Billing */}
        <Link
          href="/settings/billing"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors"
        >
          <CreditCard className="h-3.5 w-3.5" />
          <span>Gói dịch vụ</span>
        </Link>

        {user?.isSystemAdmin && (
          <Link
            href="/admin"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-slate-900 text-white hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-blue-400" />
            <span>Admin Portal</span>
          </Link>
        )}

        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2 rounded-full py-1 px-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {user?.fullName && (
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user.fullName}
              </span>
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
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user?.fullName || 'Người dùng'}
                </p>
                {user?.email && (
                  <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                )}
              </div>

              <div className="py-1">
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

                {user?.isSystemAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50/50 hover:bg-blue-50 transition-colors"
                  >
                    <ShieldCheck className="h-4 w-4 text-blue-600" />
                    Trang Quản trị Hệ thống
                  </Link>
                )}
              </div>

              <div className="py-1">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
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
