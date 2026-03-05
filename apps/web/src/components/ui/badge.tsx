import { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'brand' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export function Badge({
  className,
  variant = 'default',
  size = 'sm',
  children,
  ...props
}: BadgeProps) {
  const variants = {
    default: 'bg-dark-700/50 text-dark-300 border-dark-600/30',
    brand: 'bg-brand-400/10 text-brand-400 border-brand-400/20',
    success: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    danger: 'bg-red-500/10 text-red-400 border-red-500/20',
    info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[10px]',
    md: 'px-2.5 py-1 text-xs',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border font-medium uppercase tracking-wider',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}
