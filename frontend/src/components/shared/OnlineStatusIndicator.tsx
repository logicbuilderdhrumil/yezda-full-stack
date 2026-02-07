/**
 * OnlineStatusIndicator – color-coded dot with optional label.
 *
 * Wraps the existing StatusIndicator from `@/components/ui/Badge` and adds
 * an optional text label next to the dot.
 */
import { type ReactNode } from 'react';
import { cn } from '@/utils';
import { StatusIndicator } from '@/components/ui/Badge';
import type { OnlineStatusIndicatorProps, OnlineStatus } from '@/@types/custom-components';

// ============================================================================
// LABEL MAP
// ============================================================================

const STATUS_LABELS: Record<OnlineStatus, string> = {
  online: 'Online',
  offline: 'Offline',
  away: 'Away',
  busy: 'Busy',
};

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Small dot indicating online/offline/away/busy status with an optional text label.
 *
 * @example
 * ```tsx
 * <OnlineStatusIndicator status="online" showLabel />
 * <OnlineStatusIndicator status="busy" size="lg" />
 * ```
 */
export function OnlineStatusIndicator({
  status,
  size = 'md',
  showLabel = false,
  className,
}: OnlineStatusIndicatorProps): ReactNode {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <StatusIndicator status={status} size={size} label={STATUS_LABELS[status]} />
      {showLabel && (
        <span
          className={cn(
            'text-gray-600 dark:text-gray-400',
            size === 'sm' && 'text-xs',
            size === 'md' && 'text-sm',
            size === 'lg' && 'text-base',
          )}
        >
          {STATUS_LABELS[status]}
        </span>
      )}
    </span>
  );
}
