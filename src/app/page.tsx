import { redirect } from 'next/navigation';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';

export default async function HomePage() {
  const session = await getCurrentUserSession();
  if (!session?.user) {
    redirect('/login');
  }
  if (session.user.isSystemAdmin) {
    redirect('/admin/dashboard');
  }
  redirect('/dashboard');
}
