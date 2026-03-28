import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const isDisabled = disabled || isLoading;

    const variants = {
      primary: [
        'relative overflow-hidden font-semibold text-dark-900',
        'bg-gradient-to-r from-brand-400 via-brand-300 to-brand-400 bg-[length:200%_100%]',
        'hover:bg-right hover:shadow-lg hover:shadow-brand-400/25 hover:scale-[1.02]',
        'active:scale-[0.98]',
      ].join(' '),
      secondary: [
        'bg-dark-700/80 text-dark-100 border border-dark-600/50 backdrop-blur-sm',
        'hover:bg-dark-600/80 hover:border-dark-500/60 hover:shadow-md hover:shadow-black/20',
        'active:scale-[0.98]',
      ].join(' '),
      outline: [
        'border border-dark-500/25 text-dark-200 bg-transparent',
        'hover:border-brand-400/40 hover:text-brand-400 hover:bg-brand-400/5 hover:shadow-md hover:shadow-brand-400/10',
        'active:scale-[0.98]',
      ].join(' '),
      ghost: [
        'text-dark-300 bg-transparent',
        'hover:text-dark-100 hover:bg-dark-700/50',
        'active:scale-[0.98]',
      ].join(' '),
      danger: [
        'bg-red-500/10 text-red-400 border border-red-500/20',
        'hover:bg-red-500/20 hover:border-red-500/30 hover:shadow-md hover:shadow-red-500/10',
        'active:scale-[0.98]',
      ].join(' '),
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-xs rounded-lg',
      md: 'px-5 py-2.5 text-sm rounded-lg',
      lg: 'px-8 py-3.5 text-sm rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'group inline-flex items-center justify-center gap-2 font-medium',
          'transition-all duration-300 ease-out',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Shimmer sweep on primary */}
        {variant === 'primary' && !isDisabled && (
          <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        )}
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        <span className="relative z-10">{children}</span>
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
