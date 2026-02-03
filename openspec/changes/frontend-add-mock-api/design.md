## Context
Mock APIs allow development without a live backend.

## Goals / Non-Goals
- Goals: Provide mock responses for key endpoints.
- Non-Goals: Replace integration testing with the real backend.

## Decisions
- Decision: Use an Axios mock adapter for local responses.

## Risks / Trade-offs
- Mock data can drift from real API schemas.

## Migration Plan
- Mock high-priority endpoints first.

## Open Questions
- Which endpoints are essential for local development?
