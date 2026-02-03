## Context
Shared widgets are used by multiple modules and reduce duplication for complex UI elements.

## Goals / Non-Goals
- Goals: Provide data table, charts, rich text, maps, and gantt widgets.
- Goals: Keep consistent empty/loading states.
- Non-Goals: Custom widget configuration UIs.

## Decisions
- Decision: Wrap third-party libraries with thin adapters.
- Decision: Centralize shared widgets in components/shared.

## Risks / Trade-offs
- Third-party library updates can break wrappers.

## Migration Plan
- Build DataTable and Chart first, then add remaining widgets.

## Open Questions
- Which widgets are mandatory for MVP?
