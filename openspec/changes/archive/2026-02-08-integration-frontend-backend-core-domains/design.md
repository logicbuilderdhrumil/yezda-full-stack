## Context
Core domain capabilities are essential for admin workflow and require consistent API contracts and access control semantics.

## Goals / Non-Goals
- Goals: Consistent CRUD contracts, aligned pagination/filtering, validated access rules.
- Non-Goals: New domain features beyond existing implementations.

## Decisions
- Decision: Use shared DTOs to represent core domain resources.
- Decision: Standardize pagination and filtering parameters across endpoints.

## Risks / Trade-offs
- Risk: Divergent access control assumptions -> Mitigation: align route-guard expectations with backend policies.

## Migration Plan
1. Publish core domain contract map.
2. Align backend responses and frontend services.
3. Update mocks and add integration tests.

## Open Questions
- Should access page rules expose a single policy endpoint or be embedded in each domain response?
