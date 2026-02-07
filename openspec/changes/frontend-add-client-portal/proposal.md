# Change: Add client portal for organisation users

## Why
The web frontend currently serves as a single admin dashboard for Yezda platform administrators. Security companies and other organisations that use Yezda to screen candidates need their own client portal — a scoped view where their users (HR managers, compliance officers) can see their candidates, screening progress, pipeline status, and results without accessing platform-level administration features.

## What Changes
- Add a role-based portal switcher: detect whether the logged-in user is a platform admin or an organisation client user.
- Add a `/client` route namespace with org-scoped views: dashboard, candidates, pipeline progress, screening results, and billing.
- Add a `client` user role to the existing RBAC system (distinct from `admin`, `manager`, `agent`, `viewer`).
- Add a client-facing home dashboard showing screening summary metrics for their organisation.
- Add client-scoped candidate list showing only their organisation's candidates with screening status.
- Add client-scoped pipeline progress view.
- Add organisation settings self-service (logo, contact info, notification preferences).

## Impact
- Affected specs: (new) `client-portal`
- Affected code: frontend routes, layouts, views; backend route-guards middleware; backend user-management model
