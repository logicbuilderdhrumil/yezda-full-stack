/**
 * ConnectionStatus Component
 * Task 1.9: Add connection status indicators
 */

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';
import { useConnectionStatus } from '@/context/SocketContext';
import {
  CONNECTION_STATUS_LABELS,
  PRESENCE_STATUS_LABELS,
  PRESENCE_STATUS_COLORS,
} from '@/constants/socket.constant';
import type { ConnectionStatus as ConnectionStatusType, PresenceStatus } from '@/@types/socket';

// ============================================================================
// Connection Status Badge
// ============================================================================

export interface ConnectionStatusBadgeProps extends HTMLAttributes<HTMLDivElement> {
  /** Show label text */
  showLabel?: boolean;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Connection status badge component
 * Shows the current socket connection status
 */
export const ConnectionStatusBadge = forwardRef<HTMLDivElement, ConnectionStatusBadgeProps>(
  ({ className, showLabel = true, size = 'md', ...props }, ref) => {
    const { status, error } = useConnectionStatus();

    const sizeClasses = {
      sm: 'h-2 w-2',
      md: 'h-2.5 w-2.5',
      lg: 'h-3 w-3',
    };

    const textSizeClasses = {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    };

    const statusColors: Record<ConnectionStatusType, string> = {
      connected: 'bg-green-500',
      connecting: 'bg-yellow-500 animate-pulse',
      reconnecting: 'bg-yellow-500 animate-pulse',
      disconnected: 'bg-gray-400',
      error: 'bg-red-500',
    };

    return (
      <div
        ref={ref}
        className={cn('inline-flex items-center gap-2', className)}
        role="status"
        aria-live="polite"
        title={error ?? undefined}
        {...props}
      >
        <span
          className={cn(
            'inline-block rounded-full',
            sizeClasses[size],
            statusColors[status]
          )}
          aria-hidden="true"
        />
        {showLabel && (
          <span className={cn('text-muted-foreground', textSizeClasses[size])}>
            {CONNECTION_STATUS_LABELS[status] || status}
          </span>
        )}
      </div>
    );
  }
);

ConnectionStatusBadge.displayName = 'ConnectionStatusBadge';

// ============================================================================
// Presence Indicator
// ============================================================================

export interface PresenceIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  /** Presence status to display */
  status: PresenceStatus;
  /** Size of the indicator */
  size?: 'sm' | 'md' | 'lg';
  /** Show label text */
  showLabel?: boolean;
}

/**
 * Presence indicator component
 * Shows a user's presence status
 */
export function PresenceIndicator({
  className,
  status,
  size = 'md',
  showLabel = false,
  ...props
}: PresenceIndicatorProps): ReactNode {
  const sizeClasses = {
    sm: 'h-2 w-2',
    md: 'h-2.5 w-2.5',
    lg: 'h-3 w-3',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1.5', className)}
      role="status"
      aria-label={PRESENCE_STATUS_LABELS[status] || status}
      {...props}
    >
      <span
        className={cn(
          'inline-block rounded-full',
          sizeClasses[size],
          PRESENCE_STATUS_COLORS[status] || 'bg-gray-400'
        )}
        aria-hidden="true"
      />
      {showLabel && (
        <span className={cn('text-muted-foreground', textSizeClasses[size])}>
          {PRESENCE_STATUS_LABELS[status] || status}
        </span>
      )}
    </span>
  );
}

// ============================================================================
// Avatar with Presence
// ============================================================================

export interface AvatarPresenceProps extends HTMLAttributes<HTMLDivElement> {
  /** User's presence status */
  status: PresenceStatus;
  /** Size of the avatar wrapper */
  size?: 'sm' | 'md' | 'lg';
  /** Avatar content (image or initials) */
  children: ReactNode;
}

/**
 * AvatarPresence component
 * Wraps an avatar with a presence indicator
 */
export function AvatarPresence({
  className,
  status,
  size = 'md',
  children,
  ...props
}: AvatarPresenceProps): ReactNode {
  const indicatorSizes = {
    sm: 'h-2 w-2 -bottom-0.5 -right-0.5',
    md: 'h-2.5 w-2.5 -bottom-0.5 -right-0.5',
    lg: 'h-3 w-3 -bottom-1 -right-1',
  };

  return (
    <div className={cn('relative inline-block', className)} {...props}>
      {children}
      <span
        className={cn(
          'absolute block rounded-full ring-2 ring-background',
          indicatorSizes[size],
          PRESENCE_STATUS_COLORS[status] || 'bg-gray-400'
        )}
        role="status"
        aria-label={PRESENCE_STATUS_LABELS[status] || status}
      />
    </div>
  );
}
