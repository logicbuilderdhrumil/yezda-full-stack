/**
 * Route-level error boundary that catches uncaught errors in route components.
 * Used as `errorElement` in React Router route definitions.
 */
import { type ReactNode, useCallback } from 'react';
import { useRouteError, useNavigate } from 'react-router-dom';
import { GenericErrorView } from '@/views/GenericErrorView';

/**
 * RouteErrorBoundary renders the GenericErrorView when a route component
 * throws an uncaught error. It integrates with React Router's `errorElement`
 * and provides retry / navigation capabilities.
 */
export function RouteErrorBoundary(): ReactNode {
  const error = useRouteError();
  const navigate = useNavigate();

  const handleReset = useCallback(() => {
    // Navigate back to the same page to re-mount the route component
    navigate(0);
  }, [navigate]);

  const normalizedError =
    error instanceof Error
      ? error
      : new Error(typeof error === 'string' ? error : 'An unexpected error occurred');

  return <GenericErrorView error={normalizedError} resetError={handleReset} />;
}
