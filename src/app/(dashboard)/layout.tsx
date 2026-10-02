import React from 'react';
import { Sidebar } from '@/components/shared/sidebar';
import { Header } from '@/components/shared/header';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUserSession();

  return (
    <div className="min-h-screen bg-slate-50/50">
      <Sidebar userRole={session.user.role} />

      <div className="md:pl-64 flex flex-col flex-1 pb-16 md:pb-0">
        <Header user={session.user} organizationName={session.organizationName} />
        <main className="flex-1 p-4 sm:p-6 md:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
