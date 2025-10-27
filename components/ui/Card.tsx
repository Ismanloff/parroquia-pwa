import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'outlined';
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
}) => {
  const variantClasses = {
    default: 'bg-white shadow-sm',
    elevated: 'bg-white shadow-lg',
    outlined: 'bg-white border-2 border-slate-200',
  };

  return (
    <div
      className={cn(
        'rounded-2xl p-4',
        variantClasses[variant],
        className
      )}
    >
      {children}
    </div>
  );
};
