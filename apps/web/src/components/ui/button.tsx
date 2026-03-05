import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, disabled, children, ...props }, ref) => {
    const variants = {
      primary:
        'bg-brand-400 text-dark-900 hover:bg-brand-300 hover:shadow-lg hover:shadow-brand-400/20 font-semibold',
      secondary:
        'bg-dark-700 text-dark-100 hover:bg-dark-600 border border-dark-600/50',
      outline:
        'border border-dark-500/25 text-dark-200 hover:border-brand-400/30 hover:text-brand-400 bg-transparent',
      ghost:
        'text-dark-300 hover:text-dark-100 hover:bg-dark-700/50 bg-transparent',
      danger:
        'bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs rounded-md',
      md: 'px-5 py-2.5 text-sm rounded-lg',
      lg: 'px-8 py-3.5 text-sm rounded-xl',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-medium transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          variants[variant],
          sizes[size],
          className,
        )}
        disabled={disabled || isLoading}
        {...props}
      >
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
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
export { Button };
