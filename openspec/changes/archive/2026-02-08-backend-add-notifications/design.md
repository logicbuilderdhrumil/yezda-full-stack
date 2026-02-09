## Context
Notifications are cross-cutting and must support persistence, read status, and delivery.

## Goals / Non-Goals
- Goals: consistent notification records, realtime delivery hooks, clear retention rules.
- Non-Goals: implement a full messaging bus.

## Decisions
- Decision: store notifications in a dedicated collection with read status and timestamps.
- Alternatives considered: store notifications per module; rejected for reporting complexity.

## Risks / Trade-offs
- High volume notifications may increase storage -> mitigate with retention policy.

## Migration Plan
Start with core notification types and expand to additional modules.

## Open Questions
- What retention window is required for compliance?
