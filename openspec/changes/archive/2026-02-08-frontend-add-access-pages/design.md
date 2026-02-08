## Context
Access and error pages improve UX when users hit restricted or invalid routes.

## Goals / Non-Goals
- Goals: Provide access denied and not-found pages.
- Goals: Provide a generic error page for unexpected failures.
- Non-Goals: Full error reporting system.

## Decisions
- Decision: Use minimal layout with clear CTA back to home.
- Decision: Keep error pages outside the main shell when needed.

## Risks / Trade-offs
- Error routing must not conflict with feature routes.

## Migration Plan
- Add access denied page first, then 404 and generic error.

## Open Questions
- Should error pages be localized?
