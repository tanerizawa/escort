'use client';

import { useState, ReactNode, createContext, useContext, useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

/* ---------- Context ---------- */
interface WizardContextValue {
  currentStep: number;
  totalSteps: number;
  direction: 'forward' | 'backward';
  next: () => void;
  prev: () => void;
  goTo: (step: number) => void;
  isFirst: boolean;
  isLast: boolean;
}

const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard() {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside <WizardShell>');
  return ctx;
}

/* ---------- Step Indicator ---------- */
interface StepIndicatorProps {
  steps?: { label: string; icon?: ReactNode }[];
  labels?: string[];
  current?: number;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export function StepIndicator({ steps: stepsProp, labels, current: currentProp, currentStep: currentStepProp, totalSteps, className }: StepIndicatorProps) {
  const current = currentProp ?? currentStepProp ?? 0;
  const steps = stepsProp || (labels ? labels.map(l => ({ label: l })) : Array.from({ length: totalSteps || 1 }, (_, i) => ({ label: `Langkah ${i + 1}` })));
  
  return (
    <div className={cn('w-full', className)}>
      {/* Progress bar */}
      <div className="relative mb-6">
        <div className="h-0.5 w-full bg-dark-700/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-300 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${((current) / (steps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Dots */}
        <div className="absolute -top-1.5 left-0 right-0 flex justify-between">
          {steps.map((step, i) => (
            <div key={i} className="flex flex-col items-center">
              <div
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full border-2 transition-all duration-300',
                  i < current
                    ? 'border-brand-400 bg-brand-400 scale-100'
                    : i === current
                      ? 'border-brand-400 bg-brand-400/20 scale-110 ring-4 ring-brand-400/10'
                      : 'border-dark-600 bg-dark-800',
                )}
              >
                {i < current && (
                  <svg className="h-2.5 w-2.5 text-dark-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step label */}
      <div className="text-center">
        <p className="text-[10px] font-medium uppercase tracking-widest text-brand-400/70">
          Langkah {current + 1} dari {steps.length}
        </p>
        <p className="mt-1 text-xs text-dark-400">
          {steps[current]?.label}
        </p>
      </div>
    </div>
  );
}

/* ---------- Wizard Step ---------- */
interface WizardStepProps {
  children: ReactNode;
  step?: number;
  currentStep?: number;
  direction?: string;
  className?: string;
}

export function WizardStep({ children, className }: WizardStepProps) {
  return (
    <div className={cn('w-full', className)}>
      {children}
    </div>
  );
}

/* ---------- Wizard Navigation ---------- */
interface WizardNavigationProps {
  nextLabel?: string;
  prevLabel?: string;
  onNext?: () => boolean | void | Promise<boolean | void>;
  onPrev?: () => void;
  isLoading?: boolean;
  hideBack?: boolean;
  hideNext?: boolean;
  showPrev?: boolean;
  nextDisabled?: boolean;
  currentStep?: number;
  totalSteps?: number;
  className?: string;
}

export function WizardNavigation({
  nextLabel,
  prevLabel = 'Kembali',
  onNext,
  onPrev,
  isLoading = false,
  hideBack = false,
  hideNext = false,
  showPrev,
  nextDisabled = false,
  className,
}: WizardNavigationProps) {
  const { next, prev, isFirst, isLast } = useWizard();
  
  // showPrev=false is equivalent to hideBack=true
  const shouldHideBack = hideBack || showPrev === false;

  const handleNext = async () => {
    if (onNext) {
      const result = await onNext();
      if (result === false) return;
    }
    if (!isLast) next();
  };

  const handlePrev = () => {
    if (onPrev) onPrev();
    prev();
  };

  return (
    <div className={cn('mt-8 flex items-center gap-3', isFirst || shouldHideBack ? 'justify-end' : 'justify-between', className)}>
      {!isFirst && !shouldHideBack && (
        <button
          type="button"
          onClick={handlePrev}
          className="group flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm text-dark-400 transition-all hover:text-dark-200"
        >
          <svg className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          {prevLabel}
        </button>
      )}

      {!hideNext && (
        <button
          type="button"
          onClick={handleNext}
          disabled={isLoading || nextDisabled}
          className={cn(
            'group flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold transition-all duration-200',
            'bg-brand-400 text-dark-900 hover:bg-brand-300 hover:shadow-lg hover:shadow-brand-400/20',
            'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none',
          )}
        >
          {isLoading ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : null}
          {nextLabel || (isLast ? 'Selesai' : 'Lanjutkan')}
          {!isLast && !isLoading && (
            <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

/* ---------- Wizard Shell ---------- */
interface WizardShellProps {
  children: ReactNode | ReactNode[] | ((ctx: WizardContextValue) => ReactNode);
  steps?: { label: string; icon?: ReactNode }[];
  totalSteps?: number;
  initialStep?: number;
  onStepChange?: (step: number) => void;
  className?: string;
  showIndicator?: boolean;
}

export function WizardShell({
  children,
  steps,
  totalSteps: totalStepsProp,
  initialStep = 0,
  onStepChange,
  className,
  showIndicator = true,
}: WizardShellProps) {
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Sync with initialStep prop changes (for goToSuccess patterns)
  useEffect(() => {
    if (initialStep !== currentStep) {
      setDirection(initialStep > currentStep ? 'forward' : 'backward');
      setCurrentStep(initialStep);
    }
  }, [initialStep]); // eslint-disable-line react-hooks/exhaustive-deps

  // Determine if children is a render function
  const isRenderProp = typeof children === 'function';
  const childArray = isRenderProp ? [] : (Array.isArray(children) ? children : [children]);
  const totalSteps = totalStepsProp || steps?.length || childArray.length;

  // Auto-generate steps array from totalSteps if not provided
  const stepsArray = steps || Array.from({ length: totalSteps }, (_, i) => ({ label: `Langkah ${i + 1}` }));

  const goTo = useCallback((step: number) => {
    if (step < 0 || step >= totalSteps || isAnimating) return;
    setDirection(step > currentStep ? 'forward' : 'backward');
    setIsAnimating(true);
    setCurrentStep(step);
    onStepChange?.(step);

    // Scroll to top of wizard
    contentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    setTimeout(() => setIsAnimating(false), 400);
  }, [currentStep, totalSteps, isAnimating, onStepChange]);

  const next = useCallback(() => goTo(currentStep + 1), [currentStep, goTo]);
  const prev = useCallback(() => goTo(currentStep - 1), [currentStep, goTo]);

  const value: WizardContextValue = {
    currentStep,
    totalSteps,
    direction,
    next,
    prev,
    goTo,
    isFirst: currentStep === 0,
    isLast: currentStep === totalSteps - 1,
  };

  return (
    <WizardContext.Provider value={value}>
      <div ref={contentRef} className={cn('w-full', className)}>
        {showIndicator && !isRenderProp && stepsArray.length > 1 && (
          <StepIndicator steps={stepsArray} current={currentStep} className="mb-8" />
        )}

        {isRenderProp ? (
          (children as (ctx: WizardContextValue) => ReactNode)(value)
        ) : (
          /* Step content with animation */
          <div className="relative overflow-hidden">
            <div
              key={currentStep}
              className={cn(
                'w-full',
                direction === 'forward' ? 'animate-wizard-in-right' : 'animate-wizard-in-left',
              )}
            >
              {childArray[currentStep]}
            </div>
          </div>
        )}
      </div>
    </WizardContext.Provider>
  );
}
