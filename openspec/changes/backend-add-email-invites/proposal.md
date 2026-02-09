# Proposal: Integrate Postmark Email Delivery for Invite Flows

## Summary
Add a new `email` module to the backend that integrates Postmark for transactional email delivery, implementing the invite flows described in `InviteFlows.md` — org member invites, candidate invites (from tenant users), and candidate invites (from YEZDA admins).

## Motivation
The platform requires email-based invite flows so that:
- Organisation admins can invite team members to join their tenant
- Organisation users can invite candidates for screening
- YEZDA admin users can invite candidates and assign them to organisations

Currently there is no email delivery infrastructure. Postmark is the chosen provider for transactional email.

## Scope
- **New module**: `backend/src/modules/email/` following Clean Architecture
- **Domain**: `InviteToken` entity, `EmailPort` abstraction, `IInviteTokenRepository` port
- **Application**: Use cases for send org member invite, send candidate invite, verify token, accept invite
- **Infrastructure**: `PostmarkEmailAdapter`, `NoOpEmailAdapter` (dev/test), `PostgresInviteTokenRepository`
- **Interface**: REST endpoints for invite send/verify/accept
- **Integration**: Wire invite use cases into org-management and candidate-management modules
- **Database**: Migration for `invite_tokens` table
- **Config**: `POSTMARK_SERVER_TOKEN`, `POSTMARK_FROM_ADDRESS`, `INVITE_BASE_URL` env vars

## Affected Capabilities
- `openspec/specs/user-management.md` — invite acceptance provisions users
- `openspec/specs/candidate-management.md` — candidate invite flow
- `openspec/specs/org-management.md` — org member invite flow

## Risks
- Postmark API key misconfiguration could silently drop emails → mitigated by fail-fast in production
- Token expiry edge cases → mitigated by explicit expiry checks and status derivation
- Rate limiting needed to prevent invite spam → built into use cases (3/hour/email)

## Decision
Approved for implementation.
