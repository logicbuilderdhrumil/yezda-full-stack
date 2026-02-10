import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasRole } from '@/@types/auth';

interface AdminRedirectWrapperProps {
  children: ReactNode;
}

/**
 * AdminRedirectWrapper redirects admin/manager users to /admin when they
 * land on the client portal index route.
 * 
 * This ensures admins default to their admin area while still allowing
 * them to explicitly navigate to client routes (for perspective switching).
 * 
 * Note: This wrapper is specifically for the client portal INDEX route.
 * Other client routes do not redirect admins.
 */
export function AdminRedirectWrapper({ children }: AdminRedirectWrapperProps): ReactNode {
  const { user } = useAuth();

  // Platform admin/manager users are redirected to admin area
  if (hasRole(user, 'platform_admin', 'platform_manager')) {
    return <Navigate to="/admin" replace />;
  }

  // Client users see the client portal
  return <>{children}</>;
}
