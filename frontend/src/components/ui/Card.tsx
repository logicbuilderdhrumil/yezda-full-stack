/**
 * Card component.
 */
import { forwardRef, type HTMLAttributes } from 'react';
import { cn } from '@/utils';

// ============================================================================
// CARD
// ============================================================================

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>
  (({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-xl border border-border bg-background',
        'shadow-[var(--shadow-md)] transition-all duration-200 ease-in-out',
        'dark:border-border dark:bg-background',
        className
      )}
      {...props}
    />
  )
);

Card.displayName = 'Card';

// ============================================================================
// CARD HEADER
// ============================================================================

export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 p-6', className)}
      {...props}
    />
  )
);

CardHeader.displayName = 'CardHeader';

// ============================================================================
// CARD TITLE
// ============================================================================

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);

CardTitle.displayName = 'CardTitle';

// ============================================================================
// CARD DESCRIPTION
// ============================================================================

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    />
  )
);

CardDescription.displayName = 'CardDescription';

// ============================================================================
// CARD CONTENT
// ============================================================================

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />
  )
);

CardContent.displayName = 'CardContent';

// ============================================================================
// CARD FOOTER
// ============================================================================

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center p-6 pt-0', className)}
      {...props}
    />
  )
);

CardFooter.displayName = 'CardFooter';
