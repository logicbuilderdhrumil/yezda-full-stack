## Context
Users need a central place to manage profile settings and verify external integrations.

## Goals / Non-Goals
- Goals: Allow users to update profile information.
- Goals: Support OAuth verification flows for integrations.
- Non-Goals: Complex account billing or subscription settings.

## Decisions
- Decision: Use a settings page with distinct profile and integrations sections.
- Decision: Use a dedicated OAuth callback route for verification flows.

## Risks / Trade-offs
- OAuth flow requires careful handling of redirect and error states.
- Profile changes must update cached user state throughout the app.

## Migration Plan
- Implement profile settings first, then integrations.

## Open Questions
- Which integrations are required beyond Xero?
- Are multi-tenant account settings required for org admins?
