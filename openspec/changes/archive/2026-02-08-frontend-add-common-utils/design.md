## Context
Utilities reduce duplication and provide consistent behavior for formatting and UI helpers.

## Goals / Non-Goals
- Goals: Provide shared helpers for formatting and UI behavior.
- Non-Goals: Replace feature-specific business logic.

## Decisions
- Decision: Keep utilities small, pure, and unit-testable.

## Risks / Trade-offs
- Utilities can become a dumping ground without clear ownership.

## Migration Plan
- Add utilities incrementally as features require them.

## Open Questions
- Which utilities should be considered stable public APIs?
