/**
 * Accessible Tooltip Component
 * Compliant with WCAG 2.2 AA and WAI-ARIA best practices
 *
 * Features:
 * - Full keyboard navigation (Escape to dismiss)
 * - ARIA attributes (role="tooltip", aria-describedby)
 * - WCAG 1.4.13 compliant (persistent on hover)
 * - Multiple trigger modes (hover, focus, click)
 * - Positioning options (top, right, bottom, left)
 * - Dark mode support
 * - Smooth animations
 *
 * @see https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/
 * @see https://www.w3.org/WAI/WCAG21/Understanding/content-on-hover-or-focus.html
 */

'use client';

import React, { useState, useRef, useId, useCallback, useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  /**
   * The element that triggers the tooltip
   */
  children: React.ReactElement;

  /**
   * Tooltip content to display
   */
  content: React.ReactNode;

  /**
   * Position of the tooltip relative to the trigger element
   * @default 'top'
   */
  placement?: 'top' | 'right' | 'bottom' | 'left';

  /**
   * How the tooltip should be triggered
   * @default 'hover'
   */
  trigger?: 'hover' | 'focus' | 'click' | 'hover+focus';

  /**
   * Delay before showing tooltip (in ms)
   * @default 200
   */
  delayShow?: number;

  /**
   * Delay before hiding tooltip (in ms)
   * @default 0
   */
  delayHide?: number;

  /**
   * Whether tooltip is disabled
   * @default false
   */
  disabled?: boolean;

  /**
   * Custom className for tooltip content
   */
  className?: string;

  /**
   * Custom className for tooltip arrow
   */
  arrowClassName?: string;
}

export function Tooltip({
  children,
  content,
  placement = 'top',
  trigger = 'hover',
  delayShow = 200,
  delayHide = 0,
  disabled = false,
  className,
  arrowClassName,
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isHoveringTooltip, setIsHoveringTooltip] = useState(false);
  const showTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const hideTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const triggerRef = useRef<HTMLElement>(null);
  const tooltipId = useId();

  // Clear all timeouts
  const clearTimeouts = useCallback(() => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }
  }, []);

  // Show tooltip with delay
  const showTooltip = useCallback(() => {
    if (disabled) return;

    clearTimeouts();
    showTimeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delayShow);
  }, [disabled, delayShow, clearTimeouts]);

  // Hide tooltip with delay
  const hideTooltip = useCallback(() => {
    clearTimeouts();
    hideTimeoutRef.current = setTimeout(() => {
      // Only hide if not hovering over tooltip (WCAG 1.4.13)
      if (!isHoveringTooltip) {
        setIsVisible(false);
      }
    }, delayHide);
  }, [delayHide, isHoveringTooltip, clearTimeouts]);

  // Handle Escape key to dismiss tooltip (WCAG requirement)
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isVisible) {
        setIsVisible(false);
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
    return undefined;
  }, [isVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => clearTimeouts();
  }, [clearTimeouts]);

  // Trigger handlers
  const handleMouseEnter = useCallback(() => {
    if (trigger === 'hover' || trigger === 'hover+focus') {
      showTooltip();
    }
  }, [trigger, showTooltip]);

  const handleMouseLeave = useCallback(() => {
    if (trigger === 'hover' || trigger === 'hover+focus') {
      hideTooltip();
    }
  }, [trigger, hideTooltip]);

  const handleFocus = useCallback(() => {
    if (trigger === 'focus' || trigger === 'hover+focus') {
      showTooltip();
    }
  }, [trigger, showTooltip]);

  const handleBlur = useCallback(() => {
    if (trigger === 'focus' || trigger === 'hover+focus') {
      hideTooltip();
    }
  }, [trigger, hideTooltip]);

  const handleClick = useCallback(() => {
    if (trigger === 'click') {
      setIsVisible((prev) => !prev);
    }
  }, [trigger]);

  // Clone child element and add event handlers + aria attributes
  const triggerElement = React.cloneElement(children as React.ReactElement<any>, {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onClick: handleClick,
    'aria-describedby': isVisible ? tooltipId : undefined,
  });

  // Placement styles
  const placementClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  };

  const arrowPlacementClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-b-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-l-transparent border-r-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 border-t-transparent border-b-transparent border-r-transparent',
  };

  return (
    <div className="relative inline-block">
      {triggerElement}

      {/* Tooltip */}
      {isVisible && !disabled && (
        <div
          id={tooltipId}
          role="tooltip"
          className={cn(
            // Base styles
            'absolute z-50 px-3 py-2 text-sm font-medium rounded-lg shadow-lg',
            'bg-slate-900 text-white dark:bg-slate-700',
            'max-w-xs break-words',
            // Animation
            'animate-in fade-in-0 zoom-in-95',
            'duration-200',
            // Positioning
            placementClasses[placement],
            className
          )}
          onMouseEnter={() => setIsHoveringTooltip(true)}
          onMouseLeave={() => {
            setIsHoveringTooltip(false);
            hideTooltip();
          }}
        >
          {content}

          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0',
              'border-4 border-slate-900 dark:border-slate-700',
              arrowPlacementClasses[placement],
              arrowClassName
            )}
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
}

/**
 * Simple Tooltip Variant
 * For simple text tooltips without complex positioning
 */
export function SimpleTooltip({
  children,
  text,
  ...props
}: Omit<TooltipProps, 'content'> & { text: string }) {
  return (
    <Tooltip content={text} {...props}>
      {children}
    </Tooltip>
  );
}
