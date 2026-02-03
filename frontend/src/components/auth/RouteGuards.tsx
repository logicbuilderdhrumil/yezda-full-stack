import { type ReactNode } from 'react';
import { Navigate, useLocation, type Location } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/@types/auth';

/**
 * Type guard to safely access location state with `from` property.
 */
function hasFromLocation(state: unknown): state is { from?: Location } {
  return typeof state === 'object' && state !== null && 'from' in state;
}

interface RequireAuthProps {
  children: ReactNode;
  /** Where to redirect if not authenticated. Defaults to /sign-in. */
  redirectTo?: string;
}

/**
 * RequireAuth guards routes that require authentication.
 * Redirects unauthenticated users to sign-in, preserving the intended destination.
 */
export function RequireAuth({
  children,
  redirectTo = '/sign-in',
}: RequireAuthProps): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve the attempted URL for redirecting after login
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface RequireGuestProps {
  children: ReactNode;
  /** Where to redirect if already authenticated. Defaults to /. */
  redirectTo?: string;
}

/**
 * RequireGuest guards routes that should only be accessed by unauthenticated users.
 * Redirects authenticated users to home or their intended destination.
 */
export function RequireGuest({
  children,
  redirectTo = '/',
}: RequireGuestProps): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (isAuthenticated) {
    // Redirect to intended destination or default redirect
    const from = hasFromLocation(location.state)
      ? location.state.from?.pathname ?? redirectTo
      : redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

interface RequireAuthorityProps {
  children: ReactNode;
  /** Roles allowed to access this route. Empty array means all authenticated users. */
  authorities: UserRole[];
  /** Where to redirect if unauthorized. Defaults to /access-denied. */
  redirectTo?: string;
}

/**
 * RequireAuthority guards routes that require specific user roles.
 * Must be used within RequireAuth or assumes user is already authenticated.
 */
export function RequireAuthority({
  children,
  authorities,
  redirectTo = '/access-denied',
}: RequireAuthorityProps): ReactNode {
  const { user, isLoading } = useAuth();

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Empty authorities means all authenticated users have access
  if (authorities.length === 0) {
    return <>{children}</>;
  }

  // Check if user role is in allowed authorities
  if (user && authorities.includes(user.role)) {
    return <>{children}</>;
  }

  return <Navigate to={redirectTo} replace />;
}
