'use client';
import { Check, Hourglass, MapPin, Star } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

interface BookingStatusTrackerProps {
  currentStatus: string;
  checkinAt?: string | null;
  checkoutAt?: string | null;
  cancelledAt?: string | null;
  createdAt?: string;
  className?: string;
}

interface Step {
  key: string;
  label: string;
  icon: string;
  timestamp?: string | null;
}

const statusOrder = ['PENDING', 'CONFIRMED', 'ONGOING', 'COMPLETED'];

export default function BookingStatusTracker({
  currentStatus,
  checkinAt,
  checkoutAt,
  cancelledAt,
  createdAt,
  className = '',
}: BookingStatusTrackerProps) {
  const isCancelled = currentStatus === 'CANCELLED';
  const isDisputed = currentStatus === 'DISPUTED';

  const steps: Step[] = [
    { key: 'PENDING', label: 'Menunggu', icon: 'Hourglass', timestamp: createdAt },
    { key: 'CONFIRMED', label: 'Dikonfirmasi', icon: 'Check', timestamp: undefined },
    { key: 'ONGOING', label: 'Berlangsung', icon: 'MapPin', timestamp: checkinAt },
    { key: 'COMPLETED', label: 'Selesai', icon: 'Star', timestamp: checkoutAt },
  ];

  const currentIdx = statusOrder.indexOf(currentStatus);

  const getStepState = (stepIdx: number): 'completed' | 'active' | 'upcoming' | 'cancelled' => {
    if (isCancelled || isDisputed) {
      if (stepIdx <= currentIdx) return 'completed';
      if (stepIdx === currentIdx + 1) return 'cancelled';
      return 'upcoming';
    }
    if (stepIdx < currentIdx) return 'completed';
    if (stepIdx === currentIdx) return 'active';
    return 'upcoming';
  };

  const stateColors = {
    completed: 'bg-emerald-500 text-white border-emerald-500',
    active: 'bg-brand-400 text-dark-900 border-brand-400 shadow-lg shadow-brand-400/30',
    upcoming: 'bg-dark-700/30 text-dark-500 border-dark-600/50',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/40',
  };

  const lineColors = {
    completed: 'bg-emerald-500',
    active: 'bg-brand-400',
    upcoming: 'bg-dark-600/30',
    cancelled: 'bg-red-500/30',
  };

  const formatTimestamp = (ts?: string | null) => {
    if (!ts) return null;
    return new Date(ts).toLocaleString('id-ID', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`${className}`}>
      {/* Desktop: Horizontal */}
      <div className="hidden sm:block">
        <div className="relative flex items-start justify-between">
          {steps.map((step, idx) => {
            const state = getStepState(idx);
            return (
              <div key={step.key} className="relative z-10 flex flex-1 flex-col items-center">
                {/* Connector Line */}
                {idx > 0 && (
                  <div
                    className={`absolute top-5 right-1/2 h-0.5 w-full -translate-y-1/2 ${
                      lineColors[getStepState(idx - 1) === 'active' || getStepState(idx - 1) === 'completed' ? 'completed' : state]
                    }`}
                    style={{ left: '-50%' }}
                  />
                )}

                {/* Circle */}
                <div
                  className={`relative flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-medium transition-all ${stateColors[state]}`}
                >
                  {state === 'completed' ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : state === 'cancelled' ? (
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  ) : (
                    <span className="text-xs"><Icon name={step.icon} className="h-4 w-4" /></span>
                  )}
                </div>

                {/* Label */}
                <p className={`mt-2 text-xs font-medium ${
                  state === 'active' ? 'text-brand-400' :
                  state === 'completed' ? 'text-emerald-400' :
                  state === 'cancelled' ? 'text-red-400' :
                  'text-dark-500'
                }`}>
                  {state === 'cancelled' ? (isCancelled ? 'Dibatalkan' : 'Disengketakan') : step.label}
                </p>

                {/* Timestamp */}
                {step.timestamp && (
                  <p className="mt-0.5 text-2xs text-dark-500">{formatTimestamp(step.timestamp)}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mobile: Vertical */}
      <div className="sm:hidden">
        <div className="space-y-0">
          {steps.map((step, idx) => {
            const state = getStepState(idx);
            const isLast = idx === steps.length - 1;
            return (
              <div key={step.key} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-medium ${stateColors[state]}`}
                  >
                    {state === 'completed' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : state === 'cancelled' ? (
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    ) : (
                      <span className="text-2xs"><Icon name={step.icon} className="h-3 w-3" /></span>
                    )}
                  </div>
                  {!isLast && (
                    <div className={`h-8 w-0.5 ${lineColors[state === 'completed' ? 'completed' : 'upcoming']}`} />
                  )}
                </div>
                <div className="pb-6">
                  <p className={`text-sm font-medium ${
                    state === 'active' ? 'text-brand-400' :
                    state === 'completed' ? 'text-emerald-400' :
                    state === 'cancelled' ? 'text-red-400' :
                    'text-dark-500'
                  }`}>
                    {state === 'cancelled' ? (isCancelled ? 'Dibatalkan' : 'Disengketakan') : step.label}
                  </p>
                  {step.timestamp && (
                    <p className="text-xs text-dark-500">{formatTimestamp(step.timestamp)}</p>
                  )}
                  {state === 'cancelled' && cancelledAt && (
                    <p className="text-xs text-red-500">{formatTimestamp(cancelledAt)}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
