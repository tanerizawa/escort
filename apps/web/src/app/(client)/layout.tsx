'use client';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={['CLIENT']}>
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <div className="flex flex-1">
          <Sidebar />
          <main className="flex-1 p-6 lg:p-8">{children}</main>
        </div>
      </div>
    </AuthGuard>
  );
}
