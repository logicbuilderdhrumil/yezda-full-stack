## Context
Some pages need specialized components that are too specific for the shared widget library.

## Goals / Non-Goals
- Goals: Provide components tailored to chat and file display.
- Non-Goals: Replace core chat logic or services.

## Decisions
- Decision: Keep view components scoped under components/view.

## Risks / Trade-offs
- View components can become tightly coupled to a single page.

## Migration Plan
- Add view components as pages are built.

## Open Questions
- Should view components be generalized into shared widgets over time?
