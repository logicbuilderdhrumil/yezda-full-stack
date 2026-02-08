## Context
App foundations need consistent auth and notification contracts to avoid session and messaging regressions.

## Goals / Non-Goals
- Goals: Consistent app auth and profile contracts, standardized notification registration.
- Non-Goals: Changes to app UX flows or new backend capabilities.

## Decisions
- Decision: Use shared DTOs for app auth and profile payloads.
- Decision: Standardize push token registration and topic subscription payloads.

## Risks / Trade-offs
- Risk: Token rotation differences between app and backend -> Mitigation: a documented refresh contract and tests.

## Migration Plan
1. Publish app foundation contract map.
2. Align backend endpoints and app services.
3. Update mocks and add smoke tests.

## Open Questions
- Should session refresh be proactive (background) or reactive (on 401) in the app?
