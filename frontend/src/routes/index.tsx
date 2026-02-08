import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, type RouteObject } from 'react-router-dom';
import { authRoutes } from './authRoutes';
import { AdminShell, ClientShell } from '@/components/layouts';
import { AuthorityGuard } from '@/components/route';
import { AdminGuard, ClientGuard, AdminRedirectWrapper } from '@/components/guards';
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
const TermsView = lazy(() =>
  import('@/views/TermsView').then((m) => ({ default: m.TermsView }))
);
const PrivacyView = lazy(() =>
  import('@/views/PrivacyView').then((m) => ({ default: m.PrivacyView }))
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

// Files view
const FilesListView = lazy(() =>
  import('@/views/files/FilesListView').then((m) => ({
    default: m.FilesListView,
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
const LedgerView = lazy(() =>
  import('@/views/ledger/LedgerView').then((m) => ({
    default: m.LedgerView,
  }))
);

// Placeholder views
const ScreeningListView = lazy(() =>
  import('@/views/screening/ScreeningListView').then((m) => ({
    default: m.ScreeningListView,
  }))
);
const AdminScreeningListView = lazy(() =>
  import('@/views/screening/AdminScreeningListView').then((m) => ({
    default: m.AdminScreeningListView,
  }))
);
const ReportsView = lazy(() =>
  import('@/views/reports/ReportsView').then((m) => ({
    default: m.ReportsView,
  }))
);
const SettingsView = lazy(() =>
  import('@/views/settings/SettingsView').then((m) => ({
    default: m.SettingsView,
  }))
);

// Pipeline views (admin only)
const PipelinesListView = lazy(() =>
  import('@/views/pipelines/PipelinesListView').then((m) => ({
    default: m.PipelinesListView,
  }))
);
const PipelineCreateView = lazy(() =>
  import('@/views/pipelines/PipelineCreateView').then((m) => ({
    default: m.PipelineCreateView,
  }))
);
const PipelineDetailsView = lazy(() =>
  import('@/views/pipelines/PipelineDetailsView').then((m) => ({
    default: m.PipelineDetailsView,
  }))
);
const PipelineEditView = lazy(() =>
  import('@/views/pipelines/PipelineEditView').then((m) => ({
    default: m.PipelineEditView,
  }))
);
const PipelineBuilderView = lazy(() =>
  import('@/views/pipelines/builder/PipelineBuilderView').then((m) => ({
    default: m.PipelineBuilderView,
  }))
);

// Client portal views
const ClientDashboardView = lazy(() =>
  import('@/views/client/ClientDashboardView').then((m) => ({
    default: m.ClientDashboardView,
  }))
);
const ClientCandidatesListView = lazy(() =>
  import('@/views/client/ClientCandidatesListView').then((m) => ({
    default: m.ClientCandidatesListView,
  }))
);
const ClientCandidateDetailView = lazy(() =>
  import('@/views/client/ClientCandidateDetailView').then((m) => ({
    default: m.ClientCandidateDetailView,
  }))
);
const ClientOrgSettingsView = lazy(() =>
  import('@/views/client/ClientOrgSettingsView').then((m) => ({
    default: m.ClientOrgSettingsView,
  }))
);
const ClientProfileView = lazy(() =>
  import('@/views/client/ClientProfileView').then((m) => ({
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
          {
            path: 'pipelines',
            element: withAdminGuard(PipelinesListView),
          },
          {
            path: 'pipelines/create',
            element: withAdminGuard(PipelineCreateView),
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
            path: 'pipelines/builder',
            element: withAdminGuard(PipelineBuilderView),
          },
          {
            path: 'pipelines/:id/builder',
            element: withAdminGuard(PipelineBuilderView),
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
