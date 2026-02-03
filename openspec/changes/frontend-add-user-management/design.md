## Context
Admins manage users within organizations, including roles and status.

## Goals / Non-Goals
- Goals: List, create, edit, and view users.
- Goals: Assign roles and manage user status.
- Non-Goals: End-user self-service profile flows.

## Decisions
- Decision: Use a list view with filters and search.
- Decision: Use shared form components for create/edit.
- Decision: Enforce access via SYSTEM_ADMIN and ORG_ADMIN authorities.

## Risks / Trade-offs
- Large user lists require pagination or virtualization.
- Role changes must be reflected in navigation and access control.

## Migration Plan
- Implement list and details first, then forms and role management.

## Open Questions
- What role hierarchy and permissions are required beyond current roles?
- Should user invitations be part of this flow?
