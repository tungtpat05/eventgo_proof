import React from 'react';
import { UserProfile } from '@/domain/entities';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { LogOut, ShieldCheck } from 'lucide-react';

interface AdminProfileViewProps {
  user: UserProfile;
}

export function AdminProfileView({ user }: AdminProfileViewProps) {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thông tin tài khoản</h1>
        <p className="text-sm text-slate-500">Quản trị viên Hệ thống EventGo Proof.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thông tin cá nhân</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-4 pb-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-700 border border-blue-200 overflow-hidden font-bold">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl text-blue-600">
                  {user.fullName?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-base text-slate-900">{user.fullName}</p>
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border bg-blue-50 text-blue-700 border-blue-200">
                  <ShieldCheck className="h-3 w-3" />
                  Quản trị viên
                </span>
              </div>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>

          <div>
            <span className="text-slate-500">Họ tên</span>
            <p className="font-semibold text-slate-900">{user.fullName}</p>
          </div>
          <div>
            <span className="text-slate-500">Email</span>
            <p className="font-semibold text-slate-900">{user.email}</p>
          </div>
          <Badge variant="default">Google OAuth</Badge>
        </CardContent>
        <CardFooter className="border-t border-slate-100 pt-4 flex justify-between items-center">
          <span />
          <form action={signOutAction}>
            <Button
              type="submit"
              variant="outline"
              className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
