import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { AdminProfileView } from '@/features/admin/components/admin-profile-view';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Thông tin tài khoản — EventGo Admin',
};

import { redirect } from 'next/navigation';

export default async function AdminProfilePage() {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    redirect('/login');
  }
  return <AdminProfileView user={session.user} />;
}
