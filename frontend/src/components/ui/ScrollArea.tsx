/**
 * ScrollArea component using Radix.
 */
import * as ScrollAreaPrimitive from '@radix-ui/react-scroll-area';
import { forwardRef, type ComponentPropsWithoutRef, type ElementRef } from 'react';
import { cn } from '@/utils';

// ============================================================================
// SCROLL AREA
// ============================================================================

export interface ScrollAreaProps extends ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.Root> {
  /** Viewport class name. */
  viewportClassName?: string;
}

export const ScrollArea = forwardRef<ElementRef<typeof ScrollAreaPrimitive.Root>, ScrollAreaProps>(
  ({ className, viewportClassName, children, ...props }, ref) => (
    <ScrollAreaPrimitive.Root
      ref={ref}
      className={cn('relative overflow-hidden', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        className={cn('h-full w-full rounded-[inherit]', viewportClassName)}
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  )
);

ScrollArea.displayName = 'ScrollArea';

// ============================================================================
// SCROLL BAR
// ============================================================================

export const ScrollBar = forwardRef<
  ElementRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>,
  ComponentPropsWithoutRef<typeof ScrollAreaPrimitive.ScrollAreaScrollbar>
>(({ className, orientation = 'vertical', ...props }, ref) => (
  <ScrollAreaPrimitive.ScrollAreaScrollbar
    ref={ref}
    orientation={orientation}
    className={cn(
      'flex touch-none select-none transition-colors',
      orientation === 'vertical' && 'h-full w-2.5 border-l border-l-transparent p-px',
      orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
      className
    )}
    {...props}
  >
    <ScrollAreaPrimitive.ScrollAreaThumb className="relative flex-1 rounded-full bg-gray-300 dark:bg-gray-600" />
  </ScrollAreaPrimitive.ScrollAreaScrollbar>
));

ScrollBar.displayName = 'ScrollBar';
