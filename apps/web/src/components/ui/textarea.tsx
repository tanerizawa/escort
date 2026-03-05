'use client';

import { TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-dark-400"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'w-full rounded-lg border bg-dark-800/60 px-4 py-2.5 text-sm text-dark-100',
            'placeholder:text-dark-600 transition-all duration-200 resize-none',
            'focus:border-brand-400/50 focus:outline-none focus:ring-1 focus:ring-brand-400/20',
            error
              ? 'border-red-500/40 focus:border-red-500/60 focus:ring-red-500/20'
              : 'border-dark-600/30 hover:border-dark-500/50',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
        {hint && !error && <p className="mt-1 text-xs text-dark-500">{hint}</p>}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
export { Textarea };
