'use client';

import { Navbar } from '@/components/layout/navbar';
import { Sidebar } from '@/components/layout/sidebar';
import { AuthGuard } from '@/components/auth/auth-guard';
import { LocationTracker } from '@/components/location/location-tracker';
import { GpsPermissionPrompt } from '@/components/location/gps-permission-prompt';
import { TransactionLockProvider } from '@/components/transaction/TransactionLockProvider';
import { useActiveBookingStore } from '@/stores/active-booking.store';

export default function EscortLayout({ children }: { children: React.ReactNode }) {
  const { phase } = useActiveBookingStore();

  return (
    <AuthGuard allowedRoles={['ESCORT']}>
      <TransactionLockProvider>
        <div className="flex min-h-screen flex-col">
          <Navbar />
          <div className="flex flex-1 pt-20">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 page-enter pb-[calc(1.5rem+var(--tx-banner-offset,0px))] lg:pb-[calc(2rem+var(--tx-banner-offset,0px))]">{children}</main>
          </div>
          {phase === 'ONGOING' && (
            <>
              <LocationTracker />
              <GpsPermissionPrompt />
            </>
          )}
        </div>
      </TransactionLockProvider>
    </AuthGuard>
  );
}
