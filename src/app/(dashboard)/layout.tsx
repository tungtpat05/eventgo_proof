import React from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUserSession();
  const cookieStore = await cookies();
  const viewMode = cookieStore.get('eventgo_view_mode')?.value;

  // Guard: If user is system admin, only redirect to admin dashboard if they haven't switched to client view
  if (session.user.isSystemAdmin && viewMode !== 'client') {
    redirect('/admin/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar />

      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">
        <Header user={session.user} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
