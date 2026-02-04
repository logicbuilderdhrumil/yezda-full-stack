/**
 * Shared state components - Loading, Empty, and Error states.
 */
import { type ReactNode, type HTMLAttributes } from 'react';
import { cn } from '@/utils';
import { Button } from '@/components/ui';

// ============================================================================
// LOADING STATE
// ============================================================================

export interface LoadingStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Loading message. */
  message?: string;
  /** Size of the spinner. */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show as a full-page overlay. */
  fullPage?: boolean;
}

/**
 * Loading state component with spinner and optional message.
 */
export function LoadingState({
  message = 'Loading...',
  size = 'md',
  fullPage = false,
  className,
  ...props
}: LoadingStateProps): ReactNode {
  const sizeClasses = {
    sm: 'h-4 w-4 border',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-2',
  };

  const content = (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)} {...props}>
      <div
        className={cn(
          'animate-spin rounded-full border-gray-300 border-t-primary-600 dark:border-gray-600 dark:border-t-primary-400',
          sizeClasses[size]
        )}
      />
      {message && (
        <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
      )}
    </div>
  );

  if (fullPage) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 z-50">
        {content}
      </div>
    );
  }

  return content;
}

// ============================================================================
// EMPTY STATE
// ============================================================================

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon to display. */
  icon?: ReactNode;
  /** Title text. */
  title?: string;
  /** Description text. */
  description?: string;
  /** Primary action. */
  action?: {
    label: string;
    onClick: () => void;
  };
  /** Secondary action. */
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Empty state component for when there's no data to display.
 */
export function EmptyState({
  icon,
  title = 'No data',
  description,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps): ReactNode {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      {...props}
    >
      {icon ? (
        <div className="mb-4 text-gray-400 dark:text-gray-500">{icon}</div>
      ) : (
        <div className="mb-4">
          <svg
            className="h-12 w-12 text-gray-400 dark:text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
        </div>
      )}

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>

      {description && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm">
          {description}
        </p>
      )}

      {(action || secondaryAction) && (
        <div className="mt-6 flex items-center gap-3">
          {action && (
            <Button onClick={action.onClick}>{action.label}</Button>
          )}
          {secondaryAction && (
            <Button variant="outline" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// ERROR STATE
// ============================================================================

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Error title. */
  title?: string;
  /** Error message or error object. */
  error?: string | Error;
  /** Retry action. */
  onRetry?: () => void;
  /** Custom action. */
  action?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * Error state component for displaying error messages.
 */
export function ErrorState({
  title = 'Something went wrong',
  error,
  onRetry,
  action,
  className,
  ...props
}: ErrorStateProps): ReactNode {
  const errorMessage = error instanceof Error ? error.message : error;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      {...props}
    >
      <div className="mb-4">
        <svg
          className="h-12 w-12 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{title}</h3>

      {errorMessage && (
        <p className="mt-2 text-sm text-red-600 dark:text-red-400 max-w-sm">
          {errorMessage}
        </p>
      )}

      <div className="mt-6 flex items-center gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            Try again
          </Button>
        )}
        {action && (
          <Button variant="outline" onClick={action.onClick}>
            {action.label}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// NO RESULTS STATE
// ============================================================================

export interface NoResultsStateProps extends HTMLAttributes<HTMLDivElement> {
  /** Search query that returned no results. */
  query?: string;
  /** Suggestions for the user. */
  suggestions?: string[];
  /** Clear search action. */
  onClear?: () => void;
}

/**
 * No results state for search/filter operations.
 */
export function NoResultsState({
  query,
  suggestions,
  onClear,
  className,
  ...props
}: NoResultsStateProps): ReactNode {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4 text-center',
        className
      )}
      {...props}
    >
      <div className="mb-4">
        <svg
          className="h-12 w-12 text-gray-400 dark:text-gray-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
        No results found
      </h3>

      {query && (
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          No results for &quot;{query}&quot;
        </p>
      )}

      {suggestions && suggestions.length > 0 && (
        <div className="mt-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            Try:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {suggestions.map((suggestion, idx) => (
              <li key={idx}>• {suggestion}</li>
            ))}
          </ul>
        </div>
      )}

      {onClear && (
        <Button variant="outline" onClick={onClear} className="mt-6">
          Clear search
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// CONTENT PLACEHOLDER
// ============================================================================

export interface ContentPlaceholderProps extends HTMLAttributes<HTMLDivElement> {
  /** Icon to display. */
  icon?: ReactNode;
  /** Placeholder message. */
  message?: string;
}

/**
 * Generic content placeholder for sections not yet populated.
 */
export function ContentPlaceholder({
  icon,
  message = 'Content coming soon',
  className,
  ...props
}: ContentPlaceholderProps): ReactNode {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 dark:bg-gray-800 rounded-lg border border-dashed border-gray-200 dark:border-gray-700',
        className
      )}
      {...props}
    >
      {icon ?? (
        <svg
          className="h-8 w-8 text-gray-400 dark:text-gray-500 mb-2"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400">{message}</p>
    </div>
  );
}
