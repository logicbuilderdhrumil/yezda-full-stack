## Context
Custom components encapsulate repeated UI patterns that are specific to the product.

## Goals / Non-Goals
- Goals: Provide reusable custom widgets for profile, status, and downloads.
- Non-Goals: Generic UI primitives (covered by ui-kit).

## Decisions
- Decision: Place app-specific components under components/custom.

## Risks / Trade-offs
- Custom components can overlap with shared widgets if not scoped clearly.

## Migration Plan
- Add components as needed by feature modules.

## Open Questions
- Which custom components require localization support?
