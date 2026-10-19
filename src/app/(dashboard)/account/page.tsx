import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { signOutAction } from '@/features/auth/actions/auth-actions';
import { LogOut } from 'lucide-react';
import { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tài khoản — EventGo Proof' };

export default async function AccountPage() {
  const { user } = await getCurrentUserSession();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Tài khoản Google</h1>
        <p className="text-sm text-slate-500">Danh tính dùng chung; quyền được cấp riêng trên từng chiến dịch.</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Thông tin cá nhân</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="flex items-center gap-4 pb-2">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-600 border border-slate-200 overflow-hidden font-bold">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.fullName}
                  referrerPolicy="no-referrer"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl text-slate-400">
                  {user.fullName?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            <div>
              <p className="font-semibold text-base text-slate-900">{user.fullName}</p>
              <p className="text-sm text-slate-500">{user.email}</p>
            </div>
          </div>
          <div><span className="text-slate-500">Họ tên</span><p className="font-semibold text-slate-900">{user.fullName}</p></div>
          <div><span className="text-slate-500">Email đã xác minh</span><p className="font-semibold text-slate-900">{user.email}</p></div>
          <Badge variant="default">Google OAuth</Badge>
        </CardContent>
        <CardFooter className="border-t border-slate-100 pt-4 flex justify-between items-center">
          <span></span>
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700">
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
