'use client';
import { Check, CheckCircle2, CreditCard, Hourglass, MapPin, Sparkles } from 'lucide-react';
import { Icon } from '@/components/ui/icon';

interface ProgressStep {
  key: string;
  label: string;
  icon: string;
}

const STEPS: ProgressStep[] = [
  { key: 'PAYMENT', label: 'Pembayaran', icon: 'CreditCard' },
  { key: 'READY', label: 'Siap', icon: 'CheckCircle2' },
  { key: 'CHECKIN', label: 'Check-in', icon: 'MapPin' },
  { key: 'ONGOING', label: 'Berlangsung', icon: 'Hourglass' },
  { key: 'COMPLETED', label: 'Selesai', icon: 'Sparkles' },
];

function getStepIndex(bookingStatus: string, paymentStatus?: string): number {
  if (bookingStatus === 'COMPLETED') return 4;
  if (bookingStatus === 'ONGOING') return 3;
  if (bookingStatus === 'CONFIRMED' && paymentStatus === 'ESCROW') return 2;
  if (bookingStatus === 'CONFIRMED') return 1;
  return 0;
}

interface TransactionProgressProps {
  bookingStatus: string;
  paymentStatus?: string;
}

export function TransactionProgress({ bookingStatus, paymentStatus }: TransactionProgressProps) {
  const currentStep = getStepIndex(bookingStatus, paymentStatus);

  return (
    <div className="w-full px-2">
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {STEPS.map((step, i) => {
          const isComplete = i < currentStep;
          const isCurrent = i === currentStep;
          const isFuture = i > currentStep;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              {/* Step dot/circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-full text-sm transition-all duration-500
                    ${isComplete
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30'
                      : isCurrent
                        ? 'bg-brand-500/20 text-brand-400 ring-2 ring-brand-500 ring-offset-2 ring-offset-dark-900 animate-pulse'
                        : 'bg-dark-800 text-dark-500'
                    }
                  `}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : <Icon name={step.icon} className="h-4 w-4" />}
                </div>
                <span
                  className={`mt-1.5 text-[10px] font-medium leading-tight ${
                    isComplete
                      ? 'text-brand-400'
                      : isCurrent
                        ? 'text-brand-300'
                        : 'text-dark-500'
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="mx-1 mt-[-18px] h-0.5 flex-1">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      i < currentStep
                        ? 'bg-brand-500'
                        : i === currentStep
                          ? 'bg-gradient-to-r from-brand-500 to-dark-700'
                          : 'bg-dark-700'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
