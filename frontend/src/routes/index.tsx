import { lazy, Suspense } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { authRoutes } from './authRoutes';
import { AppShell } from '@/components/layouts';
import { ProtectedRoute, AuthorityGuard } from '@/components/route';
import { RouteLoadingFallback } from '@/components/ui';

// Lazy load views for code splitting
const HomeView = lazy(() =>
  import('@/views/HomeView').then((m) => ({ default: m.HomeView }))
);
const AccessDeniedView = lazy(() =>
  import('@/views/AccessDeniedView').then((m) => ({ default: m.AccessDeniedView }))
);
const NotFoundView = lazy(() =>
  import('@/views/NotFoundView').then((m) => ({ default: m.NotFoundView }))
);
const AccountIntegrationsView = lazy(() =>
  import('@/views/account/AccountIntegrationsView').then((m) => ({
    default: m.AccountIntegrationsView,
  }))
);
const AccountSettingsView = lazy(() =>
  import('@/views/account/AccountSettingsView').then((m) => ({
    default: m.AccountSettingsView,
  }))
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

// User views (admin only)
const UsersListView = lazy(() =>
  import('@/views/users/UsersListView').then((m) => ({
    default: m.UsersListView,
  }))
);
const UserCreateView = lazy(() =>
  import('@/views/users/UserCreateView').then((m) => ({
    default: m.UserCreateView,
  }))
);
const UserEditView = lazy(() =>
  import('@/views/users/UserEditView').then((m) => ({
    default: m.UserEditView,
  }))
);
const UserDetailsView = lazy(() =>
  import('@/views/users/UserDetailsView').then((m) => ({
    default: m.UserDetailsView,
  }))
);

// Candidate views (admin and manager access)
const CandidatesListView = lazy(() =>
  import('@/views/candidates/CandidatesListView').then((m) => ({
    default: m.CandidatesListView,
  }))
);
const CandidateCreateView = lazy(() =>
  import('@/views/candidates/CandidateCreateView').then((m) => ({
    default: m.CandidateCreateView,
  }))
);
const CandidateEditView = lazy(() =>
  import('@/views/candidates/CandidateEditView').then((m) => ({
    default: m.CandidateEditView,
  }))
);
const CandidateDetailsView = lazy(() =>
  import('@/views/candidates/CandidateDetailsView').then((m) => ({
    default: m.CandidateDetailsView,
  }))
);
const CandidateBulkCreateView = lazy(() =>
  import('@/views/candidates/CandidateBulkCreateView').then((m) => ({
    default: m.CandidateBulkCreateView,
  }))
);
const CandidateSubmissionView = lazy(() =>
  import('@/views/candidates/CandidateSubmissionView').then((m) => ({
    default: m.CandidateSubmissionView,
  }))
);
const CertifiedCandidatesListView = lazy(() =>
  import('@/views/candidates/CertifiedCandidatesListView').then((m) => ({
    default: m.CertifiedCandidatesListView,
  }))
);
const ArchivedCandidatesListView = lazy(() =>
  import('@/views/candidates/ArchivedCandidatesListView').then((m) => ({
    default: m.ArchivedCandidatesListView,
  }))
);

// Forms views (admin only)
const FormsListView = lazy(() =>
  import('@/views/forms/FormsListView').then((m) => ({
    default: m.FormsListView,
  }))
);
const FormCreateView = lazy(() =>
  import('@/views/forms/FormCreateView').then((m) => ({
    default: m.FormCreateView,
  }))
);
const FormEditView = lazy(() =>
  import('@/views/forms/FormEditView').then((m) => ({
    default: m.FormEditView,
  }))
);
const FormDetailsView = lazy(() =>
  import('@/views/forms/FormDetailsView').then((m) => ({
    default: m.FormDetailsView,
  }))
);

// Chat view
const ChatView = lazy(() =>
  import('@/views/chat/ChatView').then((m) => ({
    default: m.ChatView,
  }))
);

// Ledger views (admin only)
const BilledLedgerListView = lazy(() =>
  import('@/views/ledger/BilledLedgerListView').then((m) => ({
    default: m.BilledLedgerListView,
  }))
);
const UnbilledLedgerListView = lazy(() =>
  import('@/views/ledger/UnbilledLedgerListView').then((m) => ({
    default: m.UnbilledLedgerListView,
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
 * Wraps a component with Suspense and AuthorityGuard for admin and manager routes.
 */
function withCandidateGuard(Component: React.ComponentType): React.ReactNode {
  return (
    <AuthorityGuard authority={['admin', 'manager']}>
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
  /**
   * Public candidate submission form.
   * Security Note: This endpoint is public and should have rate limiting and
   * bot protection implemented at the API gateway or backend level.
   * The form includes a honeypot field for basic bot detection.
   * Backend should validate formId and org parameters before processing.
   */
  {
    path: '/submit/:formId',
    element: withSuspense(CandidateSubmissionView),
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
      {
        path: 'account/settings',
        element: withSuspense(AccountSettingsView),
      },
      {
        path: 'account/integrations',
        element: withSuspense(AccountIntegrationsView),
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
      // User management routes (admin only)
      {
        path: 'users',
        element: withAdminGuard(UsersListView),
      },
      {
        path: 'users/new',
        element: withAdminGuard(UserCreateView),
      },
      {
        path: 'users/:id',
        element: withAdminGuard(UserDetailsView),
      },
      {
        path: 'users/:id/edit',
        element: withAdminGuard(UserEditView),
      },
      // Candidate management routes (admin and manager)
      {
        path: 'candidates',
        element: withCandidateGuard(CandidatesListView),
      },
      {
        path: 'candidates/new',
        element: withCandidateGuard(CandidateCreateView),
      },
      {
        path: 'candidates/bulk-create',
        element: withCandidateGuard(CandidateBulkCreateView),
      },
      {
        path: 'candidates/certified',
        element: withCandidateGuard(CertifiedCandidatesListView),
      },
      {
        path: 'candidates/archived',
        element: withCandidateGuard(ArchivedCandidatesListView),
      },
      {
        path: 'candidates/:id',
        element: withCandidateGuard(CandidateDetailsView),
      },
      {
        path: 'candidates/:id/edit',
        element: withCandidateGuard(CandidateEditView),
      },
      // Forms management routes (admin only)
      {
        path: 'forms',
        element: withAdminGuard(FormsListView),
      },
      {
        path: 'forms/new',
        element: withAdminGuard(FormCreateView),
      },
      {
        path: 'forms/:id',
        element: withAdminGuard(FormDetailsView),
      },
      {
        path: 'forms/:id/edit',
        element: withAdminGuard(FormEditView),
      },
      // Chat route
      {
        path: 'chat',
        element: withSuspense(ChatView),
      },
      // Ledger routes (admin only)
      {
        path: 'ledger/billed',
        element: withAdminGuard(BilledLedgerListView),
      },
      {
        path: 'ledger/unbilled',
        element: withAdminGuard(UnbilledLedgerListView),
      },
      // Additional protected routes will be added here
    ],
  },
  {
    path: '*',
    element: withSuspense(NotFoundView),
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
