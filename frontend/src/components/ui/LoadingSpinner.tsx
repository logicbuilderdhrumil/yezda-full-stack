import { type ReactNode } from 'react';

interface LoadingSpinnerProps {
  /** Size in pixels. Defaults to 32. */
  size?: number;
  /** Additional CSS classes. */
  className?: string;
}

/**
 * Loading spinner for async operations.
 */
export function LoadingSpinner({
  size = 32,
  className = '',
}: LoadingSpinnerProps): ReactNode {
  return (
    <div
      className={`animate-spin rounded-full border-2 border-primary border-t-transparent ${className}`}
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}

interface LoadingOverlayProps {
  /** Whether the overlay is visible. */
  isLoading: boolean;
  /** Optional message to display. */
  message?: string;
  children: ReactNode;
}

/**
 * Loading overlay that covers content during async operations.
 */
export function LoadingOverlay({
  isLoading,
  message,
  children,
}: LoadingOverlayProps): ReactNode {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm">
          <LoadingSpinner size={40} />
          {message && <p className="mt-3 text-sm text-gray-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
