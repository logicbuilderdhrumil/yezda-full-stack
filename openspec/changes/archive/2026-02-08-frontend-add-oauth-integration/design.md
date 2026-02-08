## Context
OAuth integrations allow external systems to connect securely.

## Goals / Non-Goals
- Goals: Provide OAuth callback handling and status updates.
- Non-Goals: Build integration-specific dashboards.

## Decisions
- Decision: Route OAuth callbacks through a dedicated verification page.

## Risks / Trade-offs
- OAuth flows depend on correct redirect URI configuration.

## Migration Plan
- Add service methods first, then UI callback handling.

## Open Questions
- Which OAuth providers are required beyond Xero?
