## Context
Product features are implemented in parallel across frontend and backend and involve file handling and async workflows.

## Goals / Non-Goals
- Goals: Consistent feature contracts, standardized file and job handling, validated integration paths.
- Non-Goals: Redesigning feature UX or backend data models.

## Decisions
- Decision: Use shared DTOs for feature modules and shared enums for statuses.
- Decision: Standardize file upload and export contracts across all features.

## Risks / Trade-offs
- Risk: Inconsistent async job status semantics -> Mitigation: a shared job status contract and realtime event naming.

## Migration Plan
1. Publish feature contract map.
2. Align DTOs and file/job conventions.
3. Update mocks and add integration tests.

## Open Questions
- Should feature modules expose a unified export endpoint or per-domain exports only?
