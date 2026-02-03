import { type ReactNode } from 'react';
import type { AuthError } from '@/@types/auth';

interface ErrorMessageProps {
  /** The error to display. */
  error: AuthError | null;
  /** Optional callback to dismiss the error. */
  onDismiss?: () => void;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Displays an error message with optional dismiss button.
 */
export function ErrorMessage({
  error,
  onDismiss,
  className = '',
}: ErrorMessageProps): ReactNode {
  if (!error) return null;

  return (
    <div
      className={`rounded-lg bg-red-50 border border-red-200 p-4 ${className}`}
      role="alert"
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-5 w-5 text-red-400"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm font-medium text-red-800">{error.message}</p>
          {error.field && (
            <p className="mt-1 text-xs text-red-600">Field: {error.field}</p>
          )}
        </div>
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="ml-3 flex-shrink-0 text-red-400 hover:text-red-600"
            aria-label="Dismiss error"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
