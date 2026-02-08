# Change: Add client portal for organisation users

## Why
The web frontend currently serves as a single admin dashboard for Yezda platform administrators. Security companies and other organisations that use Yezda to screen candidates need their own client portal — a scoped view where their users (HR managers, compliance officers) can see their candidates, screening progress, pipeline status, and results without accessing platform-level administration features.

## What Changes
- **Route inversion:** Move the client portal to `/` (the root) and relocate the admin dashboard to `/admin/` namespace.
  - Clients are the primary users of the platform; admin is the operational backend.
  - Migrate all current protected routes under `/admin/` prefix.
- Add a role-based portal redirect: admin users landing on `/` redirect to `/admin/`; client users landing on `/admin/*` redirect to `/` or access-denied.
- Add a `client` and `client_admin` user role to the existing RBAC system (distinct from `admin`, `manager`, `agent`, `viewer`).
- Add a client-facing home dashboard showing screening summary metrics for their organisation at `/`.
- Add client-scoped candidate list showing only their organisation's candidates with screening status.
- Add client-scoped pipeline progress view.
- Add organisation settings self-service (logo, contact info, notification preferences).
- **Org Perspective Switcher:** Admin users visiting client routes (`/`) see a dropdown in the header bar to switch between organisations.
  - Stores active org in session storage.
  - API calls include `X-Org-Perspective` header when admin is viewing as an org.
  - Visual "Viewing as: [Org Name]" indicator banner.

## Impact
- Affected specs: (new) `client-portal`
- Affected code: frontend routes, layouts, views, AppShell migration to AdminShell; backend route-guards middleware; backend user-management model
- **BREAKING:** All existing admin routes move from `/` to `/admin/` (backward-compat redirects provided)
