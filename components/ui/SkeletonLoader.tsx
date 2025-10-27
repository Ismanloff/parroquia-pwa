/**
 * Skeleton Loader Component
 * Displays animated placeholder while content is loading
 * Improves perceived performance with shimmer effect
 */

import { cn } from '@/lib/utils';

type SkeletonType = 'card' | 'text' | 'circle' | 'button';

interface SkeletonLoaderProps {
  type: SkeletonType;
  className?: string;
}

export function SkeletonLoader({ type, className }: SkeletonLoaderProps) {
  const baseClasses = cn(
    'animate-pulse bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200',
    'dark:from-slate-800 dark:via-slate-700 dark:to-slate-800',
    'relative overflow-hidden',
    className
  );

  const typeClasses = {
    card: 'h-32 rounded-[28px]',
    text: 'h-4 rounded-xl',
    circle: 'w-12 h-12 rounded-full',
    button: 'h-11 rounded-2xl',
  };

  return (
    <div className={cn(baseClasses, typeClasses[type])}>
      {/* Shimmer effect overlay */}
      <div className="absolute inset-0 animate-shimmer" />
    </div>
  );
}

/**
 * Skeleton for Santo/Evangelio cards
 */
export function SkeletonCard() {
  return (
    <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl rounded-[28px] p-6 mb-6 shadow-lg border border-white/20 dark:border-slate-700/30">
      <div className="flex items-start gap-4 mb-5">
        <SkeletonLoader type="circle" className="flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <SkeletonLoader type="text" className="w-24" />
          <SkeletonLoader type="text" className="w-full" />
        </div>
      </div>
      <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent mb-5" />
      <div className="space-y-3">
        <SkeletonLoader type="text" className="w-full" />
        <SkeletonLoader type="text" className="w-4/5" />
        <SkeletonLoader type="text" className="w-5/6" />
        <SkeletonLoader type="text" className="w-3/4" />
      </div>
    </div>
  );
}

/**
 * Skeleton for Home page loading state
 */
export function SkeletonHome() {
  return (
    <>
      <SkeletonCard />
      <SkeletonCard />
    </>
  );
}
