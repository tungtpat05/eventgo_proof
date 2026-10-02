'use client';

import React from 'react';
import { UserRole } from '@/domain/enums';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, LogOut, ShieldCheck, UserCheck, CheckCircle2, User } from 'lucide-react';

interface HeaderProps {
  user: {
    fullName: string;
    role: UserRole;
    email: string;
  };
  organizationName: string;
}

export function Header({ user, organizationName }: HeaderProps) {
  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case UserRole.PROJECT_MANAGER:
        return (
          <Badge variant="default" className="flex items-center gap-1">
            <ShieldCheck className="h-3 w-3" />
            Project Manager
          </Badge>
        );
      case UserRole.SUPERVISOR:
        return (
          <Badge variant="success" className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Site Supervisor
          </Badge>
        );
      case UserRole.APPROVER:
        return (
          <Badge variant="warning" className="flex items-center gap-1">
            <UserCheck className="h-3 w-3" />
            Approver
          </Badge>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-6">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700">
          <Building2 className="h-4 w-4 text-slate-500" />
          <span className="font-semibold text-slate-900">{organizationName}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="hidden sm:flex flex-col items-end">
          <span className="text-sm font-semibold text-slate-900">{user.fullName}</span>
          <span className="text-xs text-slate-500">{user.email}</span>
        </div>

        <div className="hidden sm:block">
          {getRoleBadge(user.role)}
        </div>

        <div className="h-8 w-px bg-slate-200" />

        <form action={signOutAction}>
          <Button variant="ghost" size="sm" type="submit" className="text-slate-600 hover:text-red-600">
            <LogOut className="h-4 w-4 mr-1.5" />
            <span className="hidden sm:inline">Đăng xuất</span>
          </Button>
        </form>
      </div>
    </header>
  );
}
