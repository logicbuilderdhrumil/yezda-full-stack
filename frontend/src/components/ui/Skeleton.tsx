/**
 * Skeleton loading component.
 */
import { type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/utils';

// ============================================================================
// SKELETON
// ============================================================================

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Animation style. */
  animation?: 'pulse' | 'shimmer' | 'none';
}

/**
 * Skeleton placeholder for loading states.
 */
export function Skeleton({
  className,
  animation = 'pulse',
  ...props
}: SkeletonProps): ReactNode {
  return (
    <div
      className={cn(
        'rounded-md bg-gray-200 dark:bg-gray-700',
        animation === 'pulse' && 'animate-pulse',
        animation === 'shimmer' &&
          'relative overflow-hidden before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent',
        className
      )}
      {...props}
    />
  );
}

// ============================================================================
// SKELETON TEXT
// ============================================================================

export interface SkeletonTextProps {
  /** Number of lines. */
  lines?: number;
  className?: string;
}

/**
 * Text skeleton with multiple lines.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps): ReactNode {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-4', i === lines - 1 && 'w-3/4')}
        />
      ))}
    </div>
  );
}

// ============================================================================
// SKELETON CARD
// ============================================================================

export interface SkeletonCardProps {
  /** Show header. */
  showHeader?: boolean;
  /** Show avatar. */
  showAvatar?: boolean;
  /** Number of content lines. */
  lines?: number;
  className?: string;
}

/**
 * Card skeleton for card loading states.
 */
export function SkeletonCard({
  showHeader = true,
  showAvatar = false,
  lines = 3,
  className,
}: SkeletonCardProps): ReactNode {
  return (
    <div
      className={cn(
        'rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      {showHeader && (
        <div className="mb-4 flex items-center gap-3">
          {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      )}
      <SkeletonText lines={lines} />
    </div>
  );
}

// ============================================================================
// SKELETON TABLE
// ============================================================================

export interface SkeletonTableProps {
  /** Number of rows. */
  rows?: number;
  /** Number of columns. */
  columns?: number;
  className?: string;
}

/**
 * Table skeleton for table loading states.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: SkeletonTableProps): ReactNode {
  return (
    <div className={cn('w-full', className)}>
      {/* Header */}
      <div className="flex gap-4 border-b border-gray-200 pb-2 dark:border-gray-700">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div
          key={rowIdx}
          className="flex gap-4 border-b border-gray-200 py-3 dark:border-gray-700"
        >
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
