'use client';

import React, { useActionState, useState } from 'react';
import { signInAction } from '../actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { CheckCircle2, ShieldCheck, UserCheck } from 'lucide-react';

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(signInAction, null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const fillDemoAccount = (roleEmail: string) => {
    setEmail(roleEmail);
    setPassword('Demo@123456');
  };

  return (
    <Card className="w-full max-w-md shadow-xl border-slate-200">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">EventGo Proof</CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Nền tảng kiểm soát & nghiệm thu gian hàng kích hoạt thương hiệu
        </CardDescription>
      </CardHeader>

      <form action={formAction}>
        <CardContent className="space-y-4">
          {state?.error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
              {state.error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="email">
              Email đăng nhập
            </label>
            <Input
              id="email"
              name="email"
              type="email"
              required
              placeholder="ten@agency.vn"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-700" htmlFor="password">
              Mật khẩu
            </label>
            <Input
              id="password"
              name="password"
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Quick Demo Credentials Selector */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 p-3">
            <p className="mb-2 text-xs font-medium text-slate-600">Chọn nhanh tài khoản Demo:</p>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => fillDemoAccount('pm1@eventgo.vn')}
                className="flex items-center justify-center gap-1 rounded bg-white px-2 py-1.5 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
                PM
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('supervisor1@eventgo.vn')}
                className="flex items-center justify-center gap-1 rounded bg-white px-2 py-1.5 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
              >
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                Giám sát
              </button>
              <button
                type="button"
                onClick={() => fillDemoAccount('approver1@eventgo.vn')}
                className="flex items-center justify-center gap-1 rounded bg-white px-2 py-1.5 font-medium text-slate-700 shadow-sm border border-slate-200 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                <UserCheck className="h-3.5 w-3.5 text-purple-600" />
                Duyệt
              </button>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col space-y-3">
          <Button type="submit" className="w-full" isLoading={isPending}>
            Đăng nhập hệ thống
          </Button>
          <p className="text-center text-xs text-slate-500">
            Chỉ dành cho nhân sự thuộc tổ chức hoặc chiến dịch được cấp phép
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
