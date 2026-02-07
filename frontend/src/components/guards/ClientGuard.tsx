import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

/**
 * Loading spinner displayed during auth state resolution.
 */
function LoadingSpinner(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
    </div>
  );
}

/**
 * ClientGuard protects client portal routes (/).
 * - Unauthenticated users are redirected to sign-in
 * - All authenticated users (including admins) can access client routes
 *   to support perspective switching feature
 */
export function ClientGuard(): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // All authenticated users can access client routes
  return <Outlet />;
}
