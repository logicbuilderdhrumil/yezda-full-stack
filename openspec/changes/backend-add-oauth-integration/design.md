## Context
OAuth integrations require secure token handling and callback validation.

## Goals / Non-Goals
- Goals: secure token storage, reliable callback validation, clear integration status.
- Non-Goals: provide a general-purpose identity provider.

## Decisions
- Decision: encrypt integration tokens at rest and rotate refresh tokens when supported.
- Alternatives considered: store tokens in plain text; rejected for security reasons.

## Risks / Trade-offs
- Token expiration or provider downtime -> mitigate with retry and refresh policies.

## Migration Plan
Implement provider-by-provider support starting with the most critical integration.

## Open Questions
- Which OAuth providers are required for the initial release?
