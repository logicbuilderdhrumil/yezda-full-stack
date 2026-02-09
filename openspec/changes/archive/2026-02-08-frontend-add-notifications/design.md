## Context
Users need a centralized list of system notifications with realtime updates.

## Goals / Non-Goals
- Goals: List notifications with timestamps and read/unread status.
- Goals: Support realtime updates and mark-as-read actions.
- Non-Goals: Complex notification rule configuration.

## Decisions
- Decision: Use a list view ordered by newest first.
- Decision: Represent read/unread status in the client and sync with backend.
- Decision: Integrate realtime updates via Firebase or Socket.IO.

## Risks / Trade-offs
- Realtime integration requires careful state reconciliation.
- High volume notifications require pagination or virtualization.

## Migration Plan
- Implement list and read/unread first, then realtime updates.

## Open Questions
- What notification types and payloads are required?
- Should notifications be grouped or filtered by category?
