import { signInWithGoogleAction } from '../actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ShieldCheck } from 'lucide-react';

interface LoginFormProps {
  error?: string;
}

export function LoginForm({ error }: LoginFormProps) {
  return (
    <Card className="w-full max-w-md border-slate-200 shadow-xl">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <CardTitle className="text-2xl font-bold tracking-tight text-slate-900">EventGo Proof</CardTitle>
        <CardDescription className="text-sm text-slate-500">
          Nền tảng kiểm soát và nghiệm thu chiến dịch kích hoạt thương hiệu
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
        <p className="text-center text-sm text-slate-600">
          Mọi tài khoản sử dụng Google để đăng nhập. Quyền được cấp riêng trên từng chiến dịch.
        </p>
      </CardContent>
      <CardFooter>
        <form action={signInWithGoogleAction} className="w-full">
          <Button type="submit" className="w-full">Tiếp tục với Google</Button>
        </form>
      </CardFooter>
    </Card>
  );
}
