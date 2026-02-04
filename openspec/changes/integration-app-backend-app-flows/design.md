## Context
App flow integrations must reflect backend workflow states to ensure reliable candidate intake and consent reuse.

## Goals / Non-Goals
- Goals: Aligned form schema contracts, standardized validation errors, consistent workflow states.
- Non-Goals: Changes to the flow UX beyond contract alignment.

## Decisions
- Decision: Use shared DTOs for form schemas and submission states.
- Decision: Standardize validation error details for form submissions.

## Risks / Trade-offs
- Risk: Divergent workflow states across app and backend -> Mitigation: a shared state enum and tests.

## Migration Plan
1. Publish app flow contract map.
2. Align backend workflow responses and app services.
3. Update mocks and add integration tests.

## Open Questions
- Should offline submissions queue locally or fail fast with retry guidance?
