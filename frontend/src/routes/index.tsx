import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { authRoutes } from './authRoutes';
import { AppShell } from '@/components/layouts';
import { ProtectedRoute, NotFoundView } from '@/components/route';
import { RouteLoadingFallback } from '@/components/ui';

// Lazy load views for code splitting
const HomeView = lazy(() =>
  import('@/views/HomeView').then((m) => ({ default: m.HomeView }))
);
const AccessDeniedView = lazy(() =>
  import('@/views/AccessDeniedView').then((m) => ({ default: m.AccessDeniedView }))
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
      // Additional protected routes will be added here
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
