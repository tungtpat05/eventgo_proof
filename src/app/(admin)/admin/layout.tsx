import React from 'react';
import { getCurrentUserSession } from '@/application/use-cases/auth/get-current-user';
import { redirect } from 'next/navigation';
import { AdminSidebar } from '@/features/admin/components/admin-sidebar';
import { AdminHeader } from '@/features/admin/components/admin-header';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentUserSession();

  // Guard: Must be system admin
  if (!session.user.isSystemAdmin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar />

      {/* Main Admin Content Area */}
      <div className="md:pl-64 flex flex-col flex-1 min-w-0 min-h-screen">
        <AdminHeader user={session.user} />

        <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
