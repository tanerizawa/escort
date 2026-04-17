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
        <div className="relative flex min-h-screen flex-col bg-dark-900">
          {/* Portal ambience — partner side gets a slightly warmer velvet wash */}
          <div
            className="pointer-events-none fixed inset-0 -z-0 opacity-80"
            style={{
              background:
                'radial-gradient(ellipse at 20% -10%, rgba(176,74,85,0.12), transparent 55%), radial-gradient(ellipse at 110% 40%, rgba(201,169,110,0.08), transparent 55%)',
            }}
          />
          <Navbar />
          <div className="relative z-10 flex flex-1 pt-20">
            <Sidebar />
            <main className="flex-1 p-6 lg:p-8 page-enter pb-[calc(1.5rem+var(--tx-banner-offset,0px))] lg:pb-[calc(2rem+var(--tx-banner-offset,0px))]">
              {children}
            </main>
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
