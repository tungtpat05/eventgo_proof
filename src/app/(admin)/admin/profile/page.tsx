import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { AdminProfileView } from '@/features/admin/components/admin-profile-view';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('admin.profile');
  return {
    title: t('metaTitle'),
  };
}

import { redirect } from 'next/navigation';

export default async function AdminProfilePage() {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    redirect('/login');
  }
  return <AdminProfileView user={session.user} />;
}
