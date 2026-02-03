/**
 * Tooltip component using Radix.
 */
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import { cn } from '@/utils';

// ============================================================================
// TOOLTIP PROVIDER
// ============================================================================

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

// ============================================================================
// TOOLTIP CONTENT
// ============================================================================

export const TooltipContent = forwardRef<
  ElementRef<typeof TooltipPrimitive.Content>,
  ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={cn(
        'z-50 overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm shadow-md',
        'animate-in fade-in-0 zoom-in-95',
        'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        'dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100',
        className
      )}
      {...props}
    />
  </TooltipPrimitive.Portal>
));

TooltipContent.displayName = 'TooltipContent';

// ============================================================================
// SIMPLE TOOLTIP WRAPPER
// ============================================================================

export interface SimpleTooltipProps {
  children: ReactNode;
  /** Tooltip content. */
  content: ReactNode;
  /** Tooltip side. */
  side?: 'top' | 'right' | 'bottom' | 'left';
  /** Delay before showing. */
  delayDuration?: number;
}

/**
 * Simple tooltip wrapper for common use cases.
 */
export function SimpleTooltip({
  children,
  content,
  side = 'top',
  delayDuration = 200,
}: SimpleTooltipProps): ReactNode {
  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>{content}</TooltipContent>
    </Tooltip>
  );
}
