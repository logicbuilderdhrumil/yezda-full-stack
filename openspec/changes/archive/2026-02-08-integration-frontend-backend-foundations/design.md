## Context
Foundation capabilities were implemented in parallel. The integration layer needs a single contract source of truth to prevent drift.

## Goals / Non-Goals
- Goals: Shared contract map, consistent error envelope, validated mock parity, baseline integration tests.
- Non-Goals: Feature-level UX changes or new domain functionality.

## Decisions
- Decision: Use shared types as the contract source of truth for request/response DTOs.
- Decision: Standardize error envelopes across foundation endpoints with a correlation identifier.
- Decision: Maintain a contract matrix for API routes and socket events per capability.

## Risks / Trade-offs
- Risk: Contract changes may introduce breaking updates -> Mitigation: version contract matrix and add smoke tests.

## Migration Plan
1. Publish contract map and error envelope conventions.
2. Align backend responses and frontend services to the contract.
3. Update mocks and add integration tests.

## Open Questions
- Should auth refresh be handled via silent refresh or explicit token rotation endpoints?
