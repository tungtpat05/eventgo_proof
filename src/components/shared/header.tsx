'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { UserProfile } from '@/domain/entities';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { User, LogOut, ChevronDown, UserCircle } from 'lucide-react';

interface HeaderProps {
  user?: UserProfile;
}

export function Header({ user }: HeaderProps) {
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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full py-1 px-2.5 text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          aria-expanded={isOpen}
          aria-haspopup="true"
        >
          {user?.fullName && (
            <span className="text-sm font-medium text-slate-700">
              {user.fullName}
            </span>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200">
            <User className="h-4.5 w-4.5" />
          </div>
          <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white p-1.5 shadow-lg ring-1 ring-slate-950/5 focus:outline-none z-50 divide-y divide-slate-100">
            <div className="py-1">
              <Link
                href="/profile"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
              >
                <UserCircle className="h-4 w-4 text-slate-500" />
                Thông tin tài khoản
              </Link>
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
    </header>
  );
}
