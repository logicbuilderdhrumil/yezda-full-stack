/**
 * Drawer component (slide-out panel).
 */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';
import { cn } from '@/utils';

// ============================================================================
// DRAWER ROOT
// ============================================================================

export const Drawer = DialogPrimitive.Root;
export const DrawerTrigger = DialogPrimitive.Trigger;
export const DrawerClose = DialogPrimitive.Close;
export const DrawerPortal = DialogPrimitive.Portal;

// ============================================================================
// DRAWER OVERLAY
// ============================================================================

export const DrawerOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      'fixed inset-0 z-50 bg-black/50 backdrop-blur-sm',
      'data-[state=open]:animate-in data-[state=closed]:animate-out',
      'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
      className
    )}
    {...props}
  />
));

DrawerOverlay.displayName = 'DrawerOverlay';

// ============================================================================
// DRAWER CONTENT
// ============================================================================

export interface DrawerContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Side to slide from. */
  side?: 'left' | 'right' | 'top' | 'bottom';
  /** Show close button. */
  showClose?: boolean;
}

const slideVariants = {
  left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
  right:
    'inset-y-0 right-0 h-full w-3/4 max-w-sm data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right',
  top: 'inset-x-0 top-0 h-auto data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top',
  bottom:
    'inset-x-0 bottom-0 h-auto data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom',
};

export const DrawerContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DrawerContentProps
>(({ className, children, side = 'right', showClose = true, ...props }, ref) => (
  <DrawerPortal>
    <DrawerOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed z-50 gap-4 border bg-white p-6 shadow-lg transition ease-in-out',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:duration-300 data-[state=open]:duration-500',
        'dark:border-gray-700 dark:bg-gray-900',
        slideVariants[side],
        className
      )}
      {...props}
    >
      {children}
      {showClose && (
        <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:ring-offset-gray-900">
          <svg
            className="h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          <span className="sr-only">Close</span>
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DrawerPortal>
));

DrawerContent.displayName = 'DrawerContent';

// ============================================================================
// DRAWER HEADER & FOOTER
// ============================================================================

export function DrawerHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div className={cn('flex flex-col space-y-2', className)} {...props} />
  );
}

export function DrawerFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): ReactNode {
  return (
    <div className={cn('flex flex-col gap-2 pt-4', className)} {...props} />
  );
}

// ============================================================================
// DRAWER TITLE & DESCRIPTION
// ============================================================================

export const DrawerTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn('text-lg font-semibold', className)}
    {...props}
  />
));

DrawerTitle.displayName = 'DrawerTitle';

export const DrawerDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn('text-sm text-gray-500 dark:text-gray-400', className)}
    {...props}
  />
));

DrawerDescription.displayName = 'DrawerDescription';
