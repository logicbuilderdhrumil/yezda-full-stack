/**
 * Badge, Tag, and StatusIndicator components.
 */
import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';
import { badgeVariants, statusVariants, type BadgeVariants, type StatusVariants } from './variants';

// ============================================================================
// BADGE
// ============================================================================

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, BadgeVariants {}

/**
 * Badge component for status labels, counts, etc.
 */
export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant }), className)}
        {...props}
      />
    );
  }
);

Badge.displayName = 'Badge';

// ============================================================================
// TAG
// ============================================================================

export interface TagProps extends HTMLAttributes<HTMLSpanElement> {
  /** Optional remove handler. */
  onRemove?: () => void;
  /** Disable the tag. */
  disabled?: boolean;
}

/**
 * Tag component - removable badge-like element.
 */
export const Tag = forwardRef<HTMLSpanElement, TagProps>(
  ({ className, children, onRemove, disabled, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(
          'inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-700',
          'dark:bg-gray-700 dark:text-gray-200',
          disabled && 'opacity-50',
          className
        )}
        {...props}
      >
        {children}
        {onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full hover:bg-gray-200 dark:hover:bg-gray-600"
            aria-label="Remove"
          >
            <svg
              className="h-3 w-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

// ============================================================================
// STATUS INDICATOR
// ============================================================================

export interface StatusIndicatorProps
  extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'>,
    StatusVariants {
  /** Accessible label. */
  label?: string;
}

/**
 * Status indicator dot for presence or state.
 */
export function StatusIndicator({
  className,
  status,
  size,
  label,
  ...props
}: StatusIndicatorProps): ReactNode {
  const statusLabel = label ?? status ?? 'status';

  return (
    <span
      className={cn(statusVariants({ status, size }), className)}
      role="status"
      aria-label={statusLabel}
      {...props}
    />
  );
}
