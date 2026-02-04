/**
 * Progress component for displaying progress bars.
 */
import * as React from 'react';
import { cn } from '@/utils';

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Current progress value (0-100) */
  value?: number;
  /** Maximum value (default: 100) */
  max?: number;
  /** Whether to show indeterminate animation */
  indeterminate?: boolean;
}

/**
 * Progress displays a horizontal progress bar.
 */
const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, max = 100, indeterminate = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuenow={indeterminate ? undefined : value}
        aria-valuemin={0}
        aria-valuemax={max}
        className={cn(
          'relative h-2 w-full overflow-hidden rounded-full bg-secondary',
          className
        )}
        {...props}
      >
        <div
          className={cn(
            'h-full bg-primary transition-all duration-300 ease-in-out',
            indeterminate && 'animate-pulse'
          )}
          style={{
            width: indeterminate ? '50%' : `${percentage}%`,
            ...(indeterminate && {
              animation: 'progress-indeterminate 1.5s ease-in-out infinite',
            }),
          }}
        />
      </div>
    );
  }
);
Progress.displayName = 'Progress';

export { Progress };
