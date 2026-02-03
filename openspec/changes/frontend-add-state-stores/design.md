## Context
Global client state is shared across multiple modules and should be centralized.

## Goals / Non-Goals
- Goals: Store session, theme, locale, and presence state.
- Goals: Provide easy-to-use hooks for state access.
- Non-Goals: Replace server as the source of truth.

## Decisions
- Decision: Use Zustand for lightweight global stores.
- Decision: Persist select state in browser storage.

## Risks / Trade-offs
- Overuse of global state can cause coupling.

## Migration Plan
- Implement auth and theme stores first, then locale and presence.

## Open Questions
- Which stores require persistence beyond session scope?
