## Context
System admins manage tenant organizations that own users and candidate data.

## Goals / Non-Goals
- Goals: Provide list, create, edit, and details workflows for organizations.
- Non-Goals: Billing or subscription management.

## Decisions
- Decision: Use a list view with search/filters and a details drawer or page.
- Decision: Use shared form components for create/edit flows.
- Decision: Restrict access to SYSTEM_ADMIN authority.

## Risks / Trade-offs
- Large org lists require pagination or virtualization.
- Data model changes may require updates across user/candidate features.

## Migration Plan
- Start with list and details, then add create/edit.

## Open Questions
- What fields are required for an organization profile?
- Are status transitions (active, suspended) required in MVP?
