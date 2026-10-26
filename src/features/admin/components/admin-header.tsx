'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserProfile } from '@/domain/entities';
import { signOutAction, switchPersonaViewAction } from '@/features/auth/actions/auth-actions';
import { User, LogOut, ChevronDown, UserCircle, ShieldCheck, ChevronRight, Menu, ExternalLink } from 'lucide-react';
import { useAdminLayout } from '../context/admin-layout-context';
import { LanguageSwitcher } from '@/components/shared/language-switcher';
import { useTranslations } from 'next-intl';

interface AdminHeaderProps {
  user: UserProfile;
}

interface AdminBreadcrumb {
  group?: string;
  groupHref?: string;
  title: string;
}

function getAdminBreadcrumb(
  pathname: string,
  t: (key: string) => string
): AdminBreadcrumb {
  if (pathname === '/admin' || pathname === '/admin/dashboard') {
    return { title: t('breadcrumbs.dashboard') };
  }
  if (pathname.startsWith('/admin/transactions')) {
    return { group: t('breadcrumbs.groupBilling'), title: t('breadcrumbs.transactions') };
  }
  if (pathname.startsWith('/admin/subscriptions')) {
    return { group: t('breadcrumbs.groupBilling'), title: t('breadcrumbs.subscriptions') };
  }
  if (pathname.startsWith('/admin/plans')) {
    return { group: t('breadcrumbs.groupBilling'), title: t('breadcrumbs.plans') };
  }
  if (pathname.startsWith('/admin/payment-settings')) {
    return { group: t('breadcrumbs.groupBilling'), title: t('breadcrumbs.paymentSettings') };
  }
  if (pathname === '/admin/templates/new') {
    return {
      group: t('breadcrumbs.groupTemplates'),
      groupHref: '/admin/templates',
      title: t('breadcrumbs.templatesNew'),
    };
  }
  if (pathname.startsWith('/admin/templates')) {
    return { group: t('breadcrumbs.groupTemplates'), title: t('breadcrumbs.templates') };
  }
  if (pathname.startsWith('/admin/admins')) {
    return { group: t('breadcrumbs.groupAdmins'), title: t('breadcrumbs.admins') };
  }
  if (pathname.startsWith('/admin/profile')) {
    return { group: t('breadcrumbs.groupAccount'), title: t('breadcrumbs.profile') };
  }
  return { title: t('breadcrumbs.fallback') };
}

export function AdminHeader({ user }: AdminHeaderProps) {
  const pathname = usePathname();
  const t = useTranslations('admin.header');
  const { toggleSidebar } = useAdminLayout();
  const breadcrumb = getAdminBreadcrumb(pathname, t);
  const [isOpen, setIsOpen] = useState(false);
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 sm:px-6 backdrop-blur">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={t('openMenu')}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* 1-Line Breadcrumb: Nhóm > Tên trang */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm font-medium min-w-0">
        {breadcrumb.group ? (
          <>
            {breadcrumb.groupHref ? (
              <Link
                href={breadcrumb.groupHref}
                className="text-slate-400 hover:text-slate-700 transition-colors"
              >
                {breadcrumb.group}
              </Link>
            ) : (
              <span className="text-slate-400 select-none">{breadcrumb.group}</span>
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
      </div>

      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Language Switcher */}
        <LanguageSwitcher />

        {/* Switch to Client Workspace Button */}
        <form action={() => switchPersonaViewAction('client')}>
          <button
            type="submit"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:text-blue-800 transition-colors cursor-pointer"
            title={t('viewClientTitle')}
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>{t('clientWorkspace')}</span>
          </button>
        </form>

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="flex items-center gap-2.5 rounded-full py-1 px-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            {user.fullName && (
              <span className="text-sm font-medium text-slate-700 hidden sm:inline">
                {user.fullName}
              </span>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-bold overflow-hidden">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <User className="h-4.5 w-4.5" />
              )}
            </div>
            <ChevronDown
              className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-950/5 focus:outline-none z-50 divide-y divide-slate-100">
              {/* User profile summary */}
              <div className="px-3 py-2.5">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-[11px] text-slate-500 truncate mt-0.5">
                  {user.email}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                  <ShieldCheck className="h-3 w-3" />
                  {t('systemAdminBadge')}
                </div>
              </div>

              {/* Action items */}
              <div className="py-1">
                <Link
                  href="/admin/profile"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <UserCircle className="h-4 w-4 text-slate-500" />
                  {t('accountInfo')}
                </Link>

                <form action={() => switchPersonaViewAction('client')} className="w-full">
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-blue-700 hover:bg-blue-50 transition-colors cursor-pointer"
                  >
                    <ExternalLink className="h-4 w-4 text-blue-600" />
                    {t('enterClientWorkspace')}
                  </button>
                </form>
              </div>

              {/* Sign out */}
              <div className="py-1">
                <form action={signOutAction}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 text-rose-500" />
                    {t('signOut')}
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
