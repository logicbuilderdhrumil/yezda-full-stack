import { type ReactNode } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasRole } from '@/@types/auth';

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
 * AdminGuard protects admin routes (/admin/*).
 * - Unauthenticated users are redirected to sign-in
 * - Non-admin/manager users are redirected to client portal (/)
 * - Admin/manager users can access the route
 */
export function AdminGuard(): ReactNode {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  // Check if user has platform admin or manager role
  if (!hasRole(user, 'platform_admin', 'platform_manager')) {
    // Non-admin users are redirected to client portal
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
