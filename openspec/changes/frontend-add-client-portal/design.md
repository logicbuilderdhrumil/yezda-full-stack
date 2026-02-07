## Context
Yezda operates as a screening platform serving multiple organisations. Currently, all web users share the same admin-focused interface. Organisations need a client-facing portal where their staff can monitor screening progress, view candidate status, and manage their org settings — without seeing other organisations' data or platform administration tools.

## Goals / Non-Goals
- **Goals:**
  - Provide a distinct client experience for organisation users.
  - Scope all client views to the user's `tenantId`.
  - Allow client users to view (not manage) candidate screening status and pipeline progress.
  - Allow client admins to update their organisation's settings.
  - Provide a client dashboard with screening metrics (in-progress, completed, pending counts).
- **Non-Goals:**
  - Giving client users form-builder access — form design remains a platform admin function.
  - Creating a separate deployable application — the client portal is a route namespace within the existing SPA.
  - User self-registration for client users — platform admins invite client users.

## Decisions
- **Decision:** Add a `client` role (and optionally `client_admin`) to the existing RBAC model rather than creating a separate auth system.
  - *Alternatives:* Separate auth/app — rejected because it duplicates infrastructure and complicates SSO.
- **Decision:** The portal is a `/client/*` route namespace within the existing React SPA, gated by role.
  - *Alternatives:* Separate login page for clients — rejected for now; role-based routing is simpler and the AppShell already supports different nav configurations.
- **Decision:** Client views are read-focused with limited write access (org settings, profile). Candidate management mutations remain admin-only.
  - *Alternatives:* Full CRUD for clients — rejected because screening operations should be managed centrally.

## Risks / Trade-offs
- Adding the `client` role is additive — no breaking change to existing roles.
- The AppShell navigation needs to be role-aware to show different menus for admins vs clients.
- Client users seeing a "No Access" landing page if they navigate to `/organizations` or `/forms` is expected; the nav should simply not show those links.

## Open Questions
- Should client users be able to initiate new screening requests (assign candidates to pipelines), or only view progress?
- Should clients have access to the chat feature for communicating with Yezda platform support?
