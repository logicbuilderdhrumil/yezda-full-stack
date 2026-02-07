## Context
Yezda operates as a screening platform serving multiple organisations. Currently, all web users share the same admin-focused interface. Organisations need a client-facing portal where their staff can monitor screening progress, view candidate status, and manage their org settings — without seeing other organisations' data or platform administration tools.

## Goals / Non-Goals
- **Goals:**
  - Provide a distinct client experience for organisation users at the root route (`/`).
  - Relocate all platform admin routes to `/admin/` namespace.
  - Scope all client views to the user's `tenantId`.
  - Allow client users to view (not manage) candidate screening status and pipeline progress.
  - Allow client admins to update their organisation's settings.
  - Provide a client dashboard with screening metrics (in-progress, completed, pending counts).
  - Allow platform admins to view the client portal as any organisation via an Org Perspective Switcher.
- **Non-Goals:**
  - Giving client users form-builder access — form design remains a platform admin function.
  - Creating a separate deployable application — the client portal is a route namespace within the existing SPA.
  - User self-registration for client users — platform admins invite client users.

## Decisions
- **Decision (Routes):** Client portal at `/` (primary surface), admin at `/admin/` (secondary namespace).
  - *Rationale:* Clients are the primary users of the platform; the admin area is the operational backend.
  - *Alternatives:* Keep admin at `/` and client at `/client` — rejected because clients outnumber admins and should have the simpler URL.
- **Decision (RBAC):** Add `client` and `client_admin` roles to the existing RBAC model rather than creating a separate auth system.
  - *Alternatives:* Separate auth/app — rejected because it duplicates infrastructure and complicates SSO.
- **Decision (Layout):** Two separate shell components: `AdminShell` at `/admin/` and `ClientShell` at `/`, with shared base utilities.
  - `AdminShell` is derived from the current `AppShell.tsx` and uses `AdminSidebar.tsx`.
  - `ClientShell` is a new component using `ClientSidebar.tsx`.
  - *Alternatives:* Single AppShell with role-based nav — rejected for cleaner separation and simpler maintenance.
- **Decision (Redirect Logic):**
  - Admin user landing on `/` → redirect to `/admin/`.
  - Client user landing on `/admin/*` → redirect to `/` or access-denied page.
  - Backward-compatibility redirects from old admin routes to new `/admin/*` paths.
- **Decision (Org Perspective Switcher):** Admin users visiting client routes (`/`) see a dropdown in the header bar to switch between organisations.
  - Stores active org ID in session storage (`sessionStorage.activeOrgPerspective`).
  - API calls include `X-Org-Perspective` header when admin is viewing as an org.
  - Visual "Viewing as: [Org Name]" banner/indicator to clearly signal perspective mode.
  - *Alternatives:* URL-based org context (`/org/:orgId/...`) — rejected because it complicates routing and bookmarking.
- **Decision (Client Views):** Client views are read-focused with limited write access (org settings, profile). Candidate management mutations remain admin-only.
  - *Alternatives:* Full CRUD for clients — rejected because screening operations should be managed centrally.

## Risks / Trade-offs
- **Breaking change:** All existing admin routes move from `/` to `/admin/`. Mitigated by backward-compat redirects.
- Adding the `client` role is additive — no breaking change to existing roles.
- The Org Perspective Switcher adds complexity to client views; admins must be clearly informed they are in "viewing as" mode to avoid confusion.

## Migration Plan
1. Create `AdminShell` and `AdminSidebar` based on current `AppShell` and `Sidebar`.
2. Move all protected routes under `/admin/` prefix.
3. Add redirect rules from old paths (`/dashboard`, `/candidates`, etc.) to `/admin/*` equivalents.
4. Create `ClientShell` and `ClientSidebar` with client-specific navigation.
5. Add client routes at `/` namespace.
6. Add role-based redirects.
7. Add Org Perspective Switcher for admin users on client routes.

## Open Questions
- Should client users be able to initiate new screening requests (assign candidates to pipelines), or only view progress?
- Should clients have access to the chat feature for communicating with Yezda platform support?
