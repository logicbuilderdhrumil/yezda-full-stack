import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { authRoutes } from './authRoutes';
import { AdminShell, ClientShell } from '@/components/layouts';
import { AuthorityGuard, RouteErrorBoundary } from '@/components/route';
import { AdminGuard, ClientGuard, AdminRedirectWrapper } from '@/components/guards';
import { RouteLoadingFallback } from '@/components/ui';

// ─── Feature module lazy imports ────────────────────────────────────────────
// Each view is lazy-loaded from its feature module for code splitting.

// Dashboard feature
const HomeView = lazy(() =>
  import('@/features/dashboard/pages/HomeView').then((m) => ({ default: m.HomeView }))
);

// Shared/cross-cutting pages
const AccessDeniedView = lazy(() =>
  import('@/features/shared/pages/AccessDeniedView').then((m) => ({ default: m.AccessDeniedView }))
);
const NotFoundView = lazy(() =>
  import('@/features/shared/pages/NotFoundView').then((m) => ({ default: m.NotFoundView }))
);
const TermsView = lazy(() =>
  import('@/features/shared/pages/TermsView').then((m) => ({ default: m.TermsView }))
);
const PrivacyView = lazy(() =>
  import('@/features/shared/pages/PrivacyView').then((m) => ({ default: m.PrivacyView }))
);

// Invites feature
const AcceptInviteView = lazy(() =>
  import('@/features/invites/pages/AcceptInviteView').then((m) => ({
    default: m.AcceptInviteView,
  }))
);

// Account feature
const AccountIntegrationsView = lazy(() =>
  import('@/features/account/pages/AccountIntegrationsView').then((m) => ({
    default: m.AccountIntegrationsView,
  }))
);
const AccountSettingsView = lazy(() =>
  import('@/features/account/pages/AccountSettingsView').then((m) => ({
    default: m.AccountSettingsView,
  }))
);

// Organizations feature
const OrganizationsListView = lazy(() =>
  import('@/features/organizations/pages/OrganizationsListView').then((m) => ({
    default: m.OrganizationsListView,
  }))
);
const OrganizationCreateView = lazy(() =>
  import('@/features/organizations/pages/OrganizationCreateView').then((m) => ({
    default: m.OrganizationCreateView,
  }))
);
const OrganizationEditView = lazy(() =>
  import('@/features/organizations/pages/OrganizationEditView').then((m) => ({
    default: m.OrganizationEditView,
  }))
);
const OrganizationDetailsView = lazy(() =>
  import('@/features/organizations/pages/OrganizationDetailsView').then((m) => ({
    default: m.OrganizationDetailsView,
  }))
);

// Users feature
const UsersListView = lazy(() =>
  import('@/features/users/pages/UsersListView').then((m) => ({
    default: m.UsersListView,
  }))
);
const UserCreateView = lazy(() =>
  import('@/features/users/pages/UserCreateView').then((m) => ({
    default: m.UserCreateView,
  }))
);
const UserEditView = lazy(() =>
  import('@/features/users/pages/UserEditView').then((m) => ({
    default: m.UserEditView,
  }))
);
const UserDetailsView = lazy(() =>
  import('@/features/users/pages/UserDetailsView').then((m) => ({
    default: m.UserDetailsView,
  }))
);

// Candidates feature
const CandidatesListView = lazy(() =>
  import('@/features/candidates/pages/CandidatesListView').then((m) => ({
    default: m.CandidatesListView,
  }))
);
const CandidateCreateView = lazy(() =>
  import('@/features/candidates/pages/CandidateCreateView').then((m) => ({
    default: m.CandidateCreateView,
  }))
);
const CandidateEditView = lazy(() =>
  import('@/features/candidates/pages/CandidateEditView').then((m) => ({
    default: m.CandidateEditView,
  }))
);
const CandidateDetailsView = lazy(() =>
  import('@/features/candidates/pages/CandidateDetailsView').then((m) => ({
    default: m.CandidateDetailsView,
  }))
);
const CandidateBulkCreateView = lazy(() =>
  import('@/features/candidates/pages/CandidateBulkCreateView').then((m) => ({
    default: m.CandidateBulkCreateView,
  }))
);
const CandidateSubmissionView = lazy(() =>
  import('@/features/candidates/pages/CandidateSubmissionView').then((m) => ({
    default: m.CandidateSubmissionView,
  }))
);
const CertifiedCandidatesListView = lazy(() =>
  import('@/features/candidates/pages/CertifiedCandidatesListView').then((m) => ({
    default: m.CertifiedCandidatesListView,
  }))
);
const ArchivedCandidatesListView = lazy(() =>
  import('@/features/candidates/pages/ArchivedCandidatesListView').then((m) => ({
    default: m.ArchivedCandidatesListView,
  }))
);

// Forms feature
const FormsListView = lazy(() =>
  import('@/features/forms/pages/FormsListView').then((m) => ({
    default: m.FormsListView,
  }))
);
const FormCreateView = lazy(() =>
  import('@/features/forms/pages/FormCreateView').then((m) => ({
    default: m.FormCreateView,
  }))
);
const FormEditView = lazy(() =>
  import('@/features/forms/pages/FormEditView').then((m) => ({
    default: m.FormEditView,
  }))
);
const FormDetailsView = lazy(() =>
  import('@/features/forms/pages/FormDetailsView').then((m) => ({
    default: m.FormDetailsView,
  }))
);

// Chat feature
const ChatView = lazy(() =>
  import('@/features/chat/pages/ChatView').then((m) => ({
    default: m.ChatView,
  }))
);

// Files feature
const FilesListView = lazy(() =>
  import('@/features/files/pages/FilesListView').then((m) => ({
    default: m.FilesListView,
  }))
);

// Billing feature
const BilledLedgerListView = lazy(() =>
  import('@/features/billing/pages/BilledLedgerListView').then((m) => ({
    default: m.BilledLedgerListView,
  }))
);
const UnbilledLedgerListView = lazy(() =>
  import('@/features/billing/pages/UnbilledLedgerListView').then((m) => ({
    default: m.UnbilledLedgerListView,
  }))
);
const LedgerView = lazy(() =>
  import('@/features/billing/pages/LedgerView').then((m) => ({
    default: m.LedgerView,
  }))
);

// Screening feature
const ScreeningListView = lazy(() =>
  import('@/features/screening/pages/ScreeningListView').then((m) => ({
    default: m.ScreeningListView,
  }))
);
const AdminScreeningListView = lazy(() =>
  import('@/features/screening/pages/AdminScreeningListView').then((m) => ({
    default: m.AdminScreeningListView,
  }))
);

// Reports feature
const ReportsView = lazy(() =>
  import('@/features/reports/pages/ReportsView').then((m) => ({
    default: m.ReportsView,
  }))
);

// Settings feature
const SettingsView = lazy(() =>
  import('@/features/settings/pages/SettingsView').then((m) => ({
    default: m.SettingsView,
  }))
);

// Pipelines feature
const PipelinesListView = lazy(() =>
  import('@/features/pipelines/pages/PipelinesListView').then((m) => ({
    default: m.PipelinesListView,
  }))
);
const PipelineCreateView = lazy(() =>
  import('@/features/pipelines/pages/PipelineCreateView').then((m) => ({
    default: m.PipelineCreateView,
  }))
);
const PipelineDetailsView = lazy(() =>
  import('@/features/pipelines/pages/PipelineDetailsView').then((m) => ({
    default: m.PipelineDetailsView,
  }))
);
const PipelineEditView = lazy(() =>
  import('@/features/pipelines/pages/PipelineEditView').then((m) => ({
    default: m.PipelineEditView,
  }))
);
const PipelineBuilderView = lazy(() =>
  import('@/features/pipelines/pages/builder/PipelineBuilderView').then((m) => ({
    default: m.PipelineBuilderView,
  }))
);

// Reviews feature
const ReviewDashboardView = lazy(() =>
  import('@/features/reviews/pages/ReviewDashboard').then((m) => ({
    default: m.ReviewDashboard,
  }))
);

// Client portal feature
const ClientDashboardView = lazy(() =>
  import('@/features/client-portal/pages/ClientDashboardView').then((m) => ({
    default: m.ClientDashboardView,
  }))
);
const ClientCandidatesListView = lazy(() =>
  import('@/features/client-portal/pages/ClientCandidatesListView').then((m) => ({
    default: m.ClientCandidatesListView,
  }))
);
const ClientCandidateDetailView = lazy(() =>
  import('@/features/client-portal/pages/ClientCandidateDetailView').then((m) => ({
    default: m.ClientCandidateDetailView,
  }))
);
const ClientOrgSettingsView = lazy(() =>
  import('@/features/client-portal/pages/ClientOrgSettingsView').then((m) => ({
    default: m.ClientOrgSettingsView,
  }))
);
const ClientProfileView = lazy(() =>
  import('@/features/client-portal/pages/ClientProfileView').then((m) => ({
    default: m.ClientProfileView,
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
  {
    path: '/terms',
    element: withSuspense(TermsView),
  },
  {
    path: '/privacy',
    element: withSuspense(PrivacyView),
  },
  {
    path: '/accept-invite',
    element: withSuspense(AcceptInviteView),
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
 * Client portal routes use ClientShell layout at root (/).
 * Admin routes are wrapped with AdminShell layout under /admin prefix.
 */
export const protectedRoutes: RouteObject[] = [
  // Client portal routes (for screening clients and org staff)
  {
    path: '/',
    element: <ClientGuard />,
    children: [
      {
        element: <ClientShell />,
        errorElement: <RouteErrorBoundary />,
        children: [
          {
            index: true,
            element: (
              <AdminRedirectWrapper>
                {withSuspense(ClientDashboardView)}
              </AdminRedirectWrapper>
            ),
          },
          {
            path: 'candidates',
            element: withSuspense(ClientCandidatesListView),
          },
          {
            path: 'candidates/:id',
            element: withSuspense(ClientCandidateDetailView),
          },
          {
            path: 'screening',
            element: withSuspense(ScreeningListView),
          },
          {
            path: 'reports',
            element: withSuspense(ReportsView),
          },
          {
            path: 'settings',
            element: withSuspense(ClientOrgSettingsView),
          },
          {
            path: 'profile',
            element: withSuspense(ClientProfileView),
          },
          {
            path: 'account',
            element: withSuspense(AccountSettingsView),
          },
        ],
      },
    ],
  },
  // Admin area routes
  {
    path: '/admin',
    element: <AdminGuard />,
    children: [
      {
        element: <AdminShell />,
        errorElement: <RouteErrorBoundary />,
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
          // Organization-context routes (admin only)
          // These reuse existing views but scope them to a specific org
          {
            path: 'organizations/:orgId/candidates',
            element: withCandidateGuard(CandidatesListView),
          },
          {
            path: 'organizations/:orgId/screening',
            element: withAdminGuard(AdminScreeningListView),
          },
          {
            path: 'organizations/:orgId/files',
            element: withAdminGuard(FilesListView),
          },
          {
            path: 'organizations/:orgId/users',
            element: withAdminGuard(UsersListView),
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
          // Files route (admin only)
          {
            path: 'files',
            element: withAdminGuard(FilesListView),
          },
          // Ledger routes (admin only)
          {
            path: 'ledger',
            element: withAdminGuard(LedgerView),
          },
          {
            path: 'ledger/billed',
            element: withAdminGuard(BilledLedgerListView),
          },
          {
            path: 'ledger/unbilled',
            element: withAdminGuard(UnbilledLedgerListView),
          },
          // Screening route (admin and manager) - uses admin endpoint
          {
            path: 'screening',
            element: withCandidateGuard(AdminScreeningListView),
          },
          // Pipeline management routes (admin only)
          // Static routes MUST come before dynamic :id routes
          {
            path: 'pipelines',
            element: withAdminGuard(PipelinesListView),
          },
          {
            path: 'pipelines/create',
            element: withAdminGuard(PipelineCreateView),
          },
          {
            path: 'pipelines/builder',
            element: withAdminGuard(PipelineBuilderView),
          },
          {
            path: 'pipelines/:id',
            element: withAdminGuard(PipelineDetailsView),
          },
          {
            path: 'pipelines/:id/edit',
            element: withAdminGuard(PipelineEditView),
          },
          {
            path: 'pipelines/:id/builder',
            element: withAdminGuard(PipelineBuilderView),
          },
          // Review tasks route (admin and manager)
          {
            path: 'reviews',
            element: withCandidateGuard(ReviewDashboardView),
          },
          // Reports route (admin and manager)
          {
            path: 'reports',
            element: withCandidateGuard(ReportsView),
          },
          // Settings route
          {
            path: 'settings',
            element: withSuspense(SettingsView),
          },
        ],
      },
    ],
  },
  // Backward compatibility redirects for admin-only paths
  {
    path: '/organizations',
    element: <Navigate to="/admin/organizations" replace />,
  },
  {
    path: '/organizations/*',
    element: <Navigate to="/admin/organizations" replace />,
  },
  {
    path: '/users',
    element: <Navigate to="/admin/users" replace />,
  },
  {
    path: '/users/*',
    element: <Navigate to="/admin/users" replace />,
  },
  {
    path: '/forms',
    element: <Navigate to="/admin/forms" replace />,
  },
  {
    path: '/forms/*',
    element: <Navigate to="/admin/forms" replace />,
  },
  {
    path: '/files',
    element: <Navigate to="/admin/files" replace />,
  },
  {
    path: '/chat',
    element: <Navigate to="/admin/chat" replace />,
  },
  {
    path: '/ledger/billed',
    element: <Navigate to="/admin/ledger/billed" replace />,
  },
  {
    path: '/ledger/unbilled',
    element: <Navigate to="/admin/ledger/unbilled" replace />,
  },
  {
    path: '/account/integrations',
    element: <Navigate to="/admin/account/integrations" replace />,
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
