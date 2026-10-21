import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { AdminProfileView } from '@/features/admin/components/admin-profile-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thông tin tài khoản — EventGo Admin',
};

export default async function AdminProfilePage() {
  const { user } = await getCurrentUserSession();
  return <AdminProfileView user={user} />;
}
