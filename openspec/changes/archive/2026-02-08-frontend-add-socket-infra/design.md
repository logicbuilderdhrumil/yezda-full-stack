## Context
Realtime features rely on a shared socket infrastructure that can be reused by chat and notifications.

## Goals / Non-Goals
- Goals: Provide a reusable socket provider and hooks.
- Goals: Track presence and connection state.
- Non-Goals: Server-side socket implementation.

## Decisions
- Decision: Use Socket.IO client and a React context provider.
- Decision: Centralize event names and payload types.

## Risks / Trade-offs
- Connection stability varies by network conditions.

## Migration Plan
- Implement provider and hooks first, then add events.

## Open Questions
- Which events are required beyond chat and notifications?
