import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { authRoutes } from './authRoutes';
import { AppShell } from '@/components/layouts';
import { ProtectedRoute, AuthorityGuard, NotFoundView } from '@/components/route';
import { RouteLoadingFallback } from '@/components/ui';

// Lazy load views for code splitting
const HomeView = lazy(() =>
  import('@/views/HomeView').then((m) => ({ default: m.HomeView }))
);
const AccessDeniedView = lazy(() =>
  import('@/views/AccessDeniedView').then((m) => ({ default: m.AccessDeniedView }))
);

// Organization views (admin only)
const OrganizationsListView = lazy(() =>
  import('@/views/organizations/OrganizationsListView').then((m) => ({
    default: m.OrganizationsListView,
  }))
);
const OrganizationCreateView = lazy(() =>
  import('@/views/organizations/OrganizationCreateView').then((m) => ({
    default: m.OrganizationCreateView,
  }))
);
const OrganizationEditView = lazy(() =>
  import('@/views/organizations/OrganizationEditView').then((m) => ({
    default: m.OrganizationEditView,
  }))
);
const OrganizationDetailsView = lazy(() =>
  import('@/views/organizations/OrganizationDetailsView').then((m) => ({
    default: m.OrganizationDetailsView,
  }))
);

/**
 * Wraps a component with Suspense for lazy loading.
 */
function withSuspense(Component: React.ComponentType): React.ReactNode {
  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <Component />
    </Suspense>
  );
}

/**
 * Wraps a component with Suspense and AuthorityGuard for admin-only routes.
 */
function withAdminGuard(Component: React.ComponentType): React.ReactNode {
  return (
    <AuthorityGuard authority={['admin']}>
      <Suspense fallback={<RouteLoadingFallback />}>
        <Component />
      </Suspense>
    </AuthorityGuard>
  );
}

/**
 * Public routes that don't require authentication.
 */
export const publicRoutes: RouteObject[] = [
  ...authRoutes,
  {
    path: '/access-denied',
    element: withSuspense(AccessDeniedView),
  },
];

/**
 * Protected routes that require authentication.
 * Wrapped with AppShell layout.
 */
export const protectedRoutes: RouteObject[] = [
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: withSuspense(HomeView),
      },
      // Organization management routes (admin only)
      {
        path: 'organizations',
        element: withAdminGuard(OrganizationsListView),
      },
      {
        path: 'organizations/new',
        element: withAdminGuard(OrganizationCreateView),
      },
      {
        path: 'organizations/:id',
        element: withAdminGuard(OrganizationDetailsView),
      },
      {
        path: 'organizations/:id/edit',
        element: withAdminGuard(OrganizationEditView),
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundView />,
  },
];

/**
 * Root routes configuration.
 */
const routes: RouteObject[] = [...publicRoutes, ...protectedRoutes];

/**
 * Application router instance.
 */
export const router = createBrowserRouter(routes);
