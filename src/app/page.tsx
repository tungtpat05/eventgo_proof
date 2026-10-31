import { redirect } from 'next/navigation';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { MarketingLandingView } from '@/features/marketing/components/marketing-landing-view';

export default async function HomePage() {
  const session = await getCurrentUserSession();
  if (session?.user) {
    if (session.user.isSystemAdmin) {
      redirect('/admin/dashboard');
    }
    redirect('/dashboard');
  }

  return <MarketingLandingView />;
}
