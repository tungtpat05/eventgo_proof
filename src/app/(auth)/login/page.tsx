import { LoginForm } from '@/features/auth/components/login-form';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Đăng nhập — EventGo Proof',
  description: 'Hệ thống quản lý và nghiệm thu chiến dịch gian hàng',
};

export default function LoginPage() {
  return <LoginForm />;
}
