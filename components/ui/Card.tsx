import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'flat' | 'elevated' | 'glass' | 'outlined' | 'premium';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  interactive?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    { children, className, variant = 'flat', padding = 'md', interactive = false, ...props },
    ref
  ) => {
    const variants = {
      flat: 'bg-[var(--card-background)] border border-[var(--card-border)] shadow-[var(--card-shadow)]',
      elevated: 'bg-[var(--card-background)] shadow-lg border-transparent dark:border-slate-800',
      glass:
        'bg-[var(--glass-background)] backdrop-blur-xl border border-[var(--glass-border)] shadow-sm',
      outlined: 'bg-transparent border border-[var(--card-border)]',
      premium:
        'bg-[var(--card-background)] border border-[var(--card-border)] shadow-[var(--card-shadow)] hover:shadow-[var(--card-shadow-hover)]',
    };

    const paddings = {
      none: 'p-0',
      sm: 'p-3',
      md: 'p-5',
      lg: 'p-6 sm:p-8',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl transition-all duration-200',
          variants[variant],
          paddings[padding],
          interactive &&
            'cursor-pointer active:scale-[0.98] hover:shadow-[var(--card-shadow-hover)]',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
