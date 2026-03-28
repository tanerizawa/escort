import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

/* ───── Card ───── */
interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'outline' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = 'default', padding = 'md', hoverable = false, children, ...props }, ref) => {
    const variants = {
      default: 'border border-dark-700/40 bg-dark-800/40 backdrop-blur-sm',
      elevated: 'border border-dark-700/30 bg-dark-800/60 shadow-lg shadow-black/20 backdrop-blur-sm',
      outline: 'border border-dark-600/30 bg-transparent',
      glass: 'border border-white/[0.06] bg-dark-800/30 backdrop-blur-xl shadow-xl shadow-black/10',
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl transition-all duration-500',
          variants[variant],
          paddings[padding],
          hoverable && [
            'hover:border-brand-400/20 hover:shadow-lg hover:shadow-brand-400/[0.06]',
            'hover:translate-y-[-2px]',
          ],
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
);
Card.displayName = 'Card';

/* ───── CardHeader ───── */
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mb-4', className)} {...props} />
  ),
);
CardHeader.displayName = 'CardHeader';

/* ───── CardTitle ───── */
const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-lg font-medium text-dark-100', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

/* ───── CardDescription ───── */
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm text-dark-400 mt-1', className)} {...props} />
  ),
);
CardDescription.displayName = 'CardDescription';

/* ───── CardContent ───── */
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';

/* ───── CardFooter ───── */
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('mt-4 flex items-center gap-3', className)} {...props} />
  ),
);
CardFooter.displayName = 'CardFooter';

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
