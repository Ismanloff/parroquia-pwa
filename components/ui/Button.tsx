/**
 * Enhanced Button Component
 * Based on 2025 best practices for accessibility and UX
 *
 * Features:
 * - Loading states with spinner
 * - Icon support (left/right)
 * - Multiple variants and sizes
 * - Full accessibility (ARIA attributes)
 * - Dark mode support
 * - Keyboard navigation
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/button/
 * @see https://www.bekk.christmas/post/2023/24/accessible-loading-button
 */

import React from 'react';
import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Visual variant of the button
   */
  variant?:
    | 'default'
    | 'primary'
    | 'secondary'
    | 'outline'
    | 'ghost'
    | 'destructive'
    | 'success'
    | 'warning';

  /**
   * Size of the button
   */
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';

  /**
   * Whether the button is in a loading state
   * When true, button is disabled and shows a spinner
   */
  loading?: boolean;

  /**
   * Icon to display on the left side of the button
   */
  leftIcon?: LucideIcon;

  /**
   * Icon to display on the right side of the button
   */
  rightIcon?: LucideIcon;

  /**
   * Whether the button should take full width of its container
   */
  fullWidth?: boolean;

  /**
   * ARIA label for screen readers when button is loading
   */
  loadingText?: string;

  /**
   * Button content
   */
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'default',
      size = 'md',
      loading = false,
      leftIcon: LeftIcon,
      rightIcon: RightIcon,
      fullWidth = false,
      loadingText,
      className,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Button is disabled when loading or explicitly disabled
    const isDisabled = disabled || loading;

    // Variant styles with dark mode support
    const variantClasses = {
      default:
        'bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700',
      primary:
        'bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 shadow-sm',
      secondary:
        'bg-slate-600 text-white hover:bg-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600',
      outline:
        'bg-transparent border-2 border-slate-300 text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800',
      ghost:
        'bg-transparent text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
      destructive:
        'bg-red-600 text-white hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 shadow-sm',
      success:
        'bg-green-600 text-white hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 shadow-sm',
      warning:
        'bg-yellow-600 text-white hover:bg-yellow-700 dark:bg-yellow-500 dark:hover:bg-yellow-600 shadow-sm',
    };

    // Size styles
    const sizeClasses = {
      xs: 'px-2 py-1 text-xs gap-1',
      sm: 'px-3 py-1.5 text-sm gap-1.5',
      md: 'px-4 py-2 text-base gap-2',
      lg: 'px-6 py-3 text-lg gap-2.5',
      xl: 'px-8 py-4 text-xl gap-3',
    };

    // Icon size mapping
    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    };

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200',
          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900',
          'disabled:opacity-60 disabled:cursor-not-allowed disabled:pointer-events-none',
          // Variant and size
          variantClasses[variant],
          sizeClasses[size],
          // Full width
          fullWidth && 'w-full',
          // Loading state
          loading && 'cursor-wait',
          className
        )}
        disabled={isDisabled}
        aria-busy={loading}
        aria-disabled={isDisabled}
        aria-label={loading && loadingText ? loadingText : undefined}
        {...props}
      >
        {/* Left Icon or Loading Spinner */}
        {loading ? (
          <Loader2
            className={cn(iconSizes[size], 'animate-spin')}
            aria-hidden="true"
          />
        ) : (
          LeftIcon && <LeftIcon className={iconSizes[size]} aria-hidden="true" />
        )}

        {/* Button Text (hidden from screen readers when loading) */}
        <span className={cn(loading && 'sr-only')}>{children}</span>

        {/* Right Icon (hidden when loading) */}
        {!loading && RightIcon && <RightIcon className={iconSizes[size]} aria-hidden="true" />}

        {/* Screen reader text for loading state */}
        {loading && loadingText && <span className="sr-only">{loadingText}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';

/**
 * Icon Button Variant
 * For buttons that only contain an icon (no text)
 */
export interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'children'> {
  /**
   * Icon to display
   */
  icon: LucideIcon;

  /**
   * ARIA label (required for accessibility)
   */
  'aria-label': string;
}

export const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ icon: Icon, size = 'md', className, ...props }, ref) => {
    const sizeClasses = {
      xs: 'p-1',
      sm: 'p-1.5',
      md: 'p-2',
      lg: 'p-3',
      xl: 'p-4',
    };

    const iconSizes = {
      xs: 'w-3 h-3',
      sm: 'w-3.5 h-3.5',
      md: 'w-4 h-4',
      lg: 'w-5 h-5',
      xl: 'w-6 h-6',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(sizeClasses[size], 'aspect-square', className)}
        {...props}
      >
        <Icon className={iconSizes[size]} aria-hidden="true" />
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';
