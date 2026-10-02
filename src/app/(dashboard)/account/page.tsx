import React from 'react';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Mail, Phone, ShieldCheck, User } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tài Khoản & Cấu Hình — EventGo Proof',
};

export default async function AccountPage() {
  const session = await getCurrentUserSession();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Thông Tin Tài Khoản</h1>
        <p className="text-sm text-slate-500">
          Quản lý hồ sơ cá nhân và quyền hạn trong tổ chức
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Profile Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-700 font-bold">
                <User className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {session.user.fullName}
                </CardTitle>
                <CardDescription className="text-xs">
                  {session.user.role}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span>{session.user.email}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Phone className="h-4 w-4 text-slate-400" />
              <span>{session.user.phone || 'Chưa cập nhật SĐT'}</span>
            </div>
            <div className="pt-2">
              <Badge variant="default">Quyền hệ thống: {session.user.role}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Organization Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-700 font-bold">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base font-bold text-slate-900">
                  {session.organizationName}
                </CardTitle>
                <CardDescription className="text-xs">
                  Tổ chức kích hoạt & đối tác B2B
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3 text-xs text-slate-600">
            <p>
              Tài khoản thuộc tổ chức này được phân quyền cách ly đa khách hàng (Multi-tenant isolation) qua Supabase RLS.
            </p>
            <div className="rounded-lg bg-slate-50 p-2.5 text-[11px] text-slate-500 font-mono">
              Organization ID: {session.user.organizationId}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
