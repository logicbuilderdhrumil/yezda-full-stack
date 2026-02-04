import { type ReactNode } from 'react';
import { Navigate, useLocation, Outlet, type Location } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { hasRole } from '@/@types/auth';
import type { AppRouteConfig, RouteMeta, UserRole } from '@/@types';

/**
 * Type guard to safely access location state with `from` property.
 */
function hasFromLocation(state: unknown): state is { from?: Location } {
  return typeof state === 'object' && state !== null && 'from' in state;
}

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
 * Access denied page displayed when user lacks required authority.
 */
export function AccessDeniedView(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">403</h1>
        <p className="mt-2 text-lg text-gray-600">Access Denied</p>
        <p className="mt-1 text-gray-500">
          You do not have permission to view this page.
        </p>
        <a
          href="/"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

/**
 * Not found page displayed for unmatched routes.
 */
export function NotFoundView(): ReactNode {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900">404</h1>
        <p className="mt-2 text-lg text-gray-600">Page Not Found</p>
        <p className="mt-1 text-gray-500">
          The page you are looking for does not exist.
        </p>
        <a
          href="/"
          className="mt-4 inline-block text-primary hover:underline"
        >
          Go to Home
        </a>
      </div>
    </div>
  );
}

interface PublicRouteProps {
  children: ReactNode;
  /** Where to redirect if authenticated. Defaults to /. */
  redirectTo?: string;
}

/**
 * PublicRoute allows only unauthenticated users.
 * Redirects authenticated users to home or their intended destination.
 */
export function PublicRoute({
  children,
  redirectTo = '/',
}: PublicRouteProps): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (isAuthenticated) {
    const from = hasFromLocation(location.state)
      ? location.state.from?.pathname ?? redirectTo
      : redirectTo;
    return <Navigate to={from} replace />;
  }

  return <>{children}</>;
}

interface ProtectedRouteProps {
  children: ReactNode;
  /** Where to redirect if not authenticated. Defaults to /sign-in. */
  redirectTo?: string;
}

/**
 * ProtectedRoute requires authentication.
 * Redirects unauthenticated users to sign-in, preserving the intended destination.
 */
export function ProtectedRoute({
  children,
  redirectTo = '/sign-in',
}: ProtectedRouteProps): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface AuthorityGuardProps {
  children: ReactNode;
  /** Required roles for access. If empty or undefined, no role check is performed. */
  authority?: UserRole[] | undefined;
  /** Component to render if access is denied. Defaults to AccessDeniedView. */
  accessDeniedComponent?: ReactNode;
}

/**
 * AuthorityGuard restricts access based on user roles.
 * Uses roles array aligned with backend route-guards.middleware.ts.
 * Displays access denied page if user lacks required authority.
 */
export function AuthorityGuard({
  children,
  authority,
  accessDeniedComponent = <AccessDeniedView />,
}: AuthorityGuardProps): ReactNode {
  const { user } = useAuth();

  // No authority required, allow access
  if (!authority || authority.length === 0) {
    return <>{children}</>;
  }

  // Check if user has any of the required roles using hasRole helper
  if (hasRole(user, ...authority)) {
    return <>{children}</>;
  }

  return <>{accessDeniedComponent}</>;
}

interface AppRouteProps {
  children: ReactNode;
  /** Route meta configuration. */
  meta?: RouteMeta | undefined;
}

/**
 * AppRoute applies meta configuration to a route.
 * Handles public/protected distinction and authority checks.
 */
export function AppRoute({ children, meta }: AppRouteProps): ReactNode {
  // Public routes don't require authentication
  if (meta?.isPublic) {
    return <PublicRoute>{children}</PublicRoute>;
  }

  // Protected routes with optional authority check
  return (
    <ProtectedRoute>
      <AuthorityGuard authority={meta?.authority}>{children}</AuthorityGuard>
    </ProtectedRoute>
  );
}

interface AllRoutesProps {
  /** Route configurations to render. */
  routes: AppRouteConfig[];
}

/**
 * AllRoutes maps route configurations to route elements.
 * Used as a centralized renderer for the route tree.
 */
export function AllRoutes({ routes }: AllRoutesProps): ReactNode {
  return (
    <>
      {routes.map((route) => (
        <AppRoute key={route.path} meta={route.meta}>
          {route.element}
          {route.children && <AllRoutes routes={route.children} />}
        </AppRoute>
      ))}
    </>
  );
}

/**
 * OutletWithFallback renders child routes with a fallback for unmatched routes.
 */
export function OutletWithFallback(): ReactNode {
  return <Outlet />;
}
