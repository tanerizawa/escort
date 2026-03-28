'use client';

import { useEffect, useRef, useState } from 'react';
import { useActiveBookingStore } from '@/stores/active-booking.store';
import { useAuthStore } from '@/stores/auth.store';
import { TransactionScreen } from './TransactionScreen';
import { formatCurrency } from '@/lib/utils';
import { CircleDot, Lock, User } from 'lucide-react';

const POLL_INTERVAL_MS = 10_000;

interface TransactionLockProviderProps {
  children: React.ReactNode;
}

export function TransactionLockProvider({ children }: TransactionLockProviderProps) {
  const { user, isAuthenticated } = useAuthStore();
  const { isLocked, booking, bookings, totalActive, phase, checkActive, selectedIndex, selectBooking } = useActiveBookingStore();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [showFullScreen, setShowFullScreen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    checkActive();
    intervalRef.current = setInterval(() => { checkActive(); }, POLL_INTERVAL_MS);
    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [isAuthenticated, user?.id]);

  const isClient = user?.role === 'CLIENT';

  return (
    <>
      {children}

      {/* ── Floating Transaction Banner ── */}
      {isLocked && booking && !showFullScreen && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-brand-400/20 bg-dark-900/95 backdrop-blur-xl shadow-[0_-4px_24px_rgba(0,0,0,0.4)]">
          <div className="mx-auto max-w-4xl px-4 py-3">
            <button
              onClick={() => setShowFullScreen(true)}
              className="w-full flex items-center gap-3 text-left group"
            >
              {/* Status indicator */}
              <div className="relative shrink-0">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                  booking.status === 'ONGOING'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-brand-400/10 border border-brand-400/30'
                }`}>
                  {booking.status === 'ONGOING' ? <CircleDot className="h-5 w-5 text-green-400" /> : <Lock className="h-5 w-5 text-brand-400" />}
                </div>
                {booking.status === 'ONGOING' && (
                  <span className="absolute -top-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 animate-pulse border-2 border-dark-900" />
                )}
              </div>

              {/* Booking info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-medium text-white truncate">
                    {booking.status === 'ONGOING' ? 'Transaksi Berlangsung' : 'Siap Check-in'}
                  </h3>
                  <span className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    booking.status === 'ONGOING'
                      ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                      : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                  }`}>
                    {booking.status === 'ONGOING' ? 'LIVE' : 'READY'}
                  </span>
                  {totalActive > 1 && (
                    <span className="shrink-0 text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20">
                      +{totalActive - 1} lainnya
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-400 truncate mt-0.5">
                  <User className="h-4 w-4 inline-block" /> {isClient
                    ? `${booking.escort?.firstName || ''} ${booking.escort?.lastName || ''}`.trim()
                    : `${booking.client?.firstName || ''} ${booking.client?.lastName || ''}`.trim()
                  }
                  {' · '}
                  {booking.serviceType}
                  {' · '}
                  {formatCurrency(booking.totalAmount)}
                </p>
              </div>

              {/* Open button */}
              <div className="shrink-0 flex items-center gap-2">
                <span className="hidden sm:block text-[11px] uppercase tracking-widest text-brand-400 group-hover:text-brand-300 transition-colors">
                  Buka
                </span>
                <div className="h-8 w-8 rounded-lg bg-brand-400/10 flex items-center justify-center text-brand-400 group-hover:bg-brand-400/20 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* ── Full Transaction Screen (overlay, dismissible) ── */}
      {isLocked && booking && showFullScreen && (
        <TransactionScreen
          booking={booking}
          phase={phase || 'READY_CHECKIN'}
          onMinimize={() => setShowFullScreen(false)}
        />
      )}
    </>
  );
}
