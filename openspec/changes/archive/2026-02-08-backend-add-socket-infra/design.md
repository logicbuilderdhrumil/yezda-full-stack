## Context
Realtime features require authenticated socket connections and presence tracking.

## Goals / Non-Goals
- Goals: secure socket auth, consistent event schemas, presence updates.
- Non-Goals: replace the primary REST API with sockets.

## Decisions
- Decision: use a dedicated socket namespace with token-based auth.
- Alternatives considered: reuse REST session cookies; rejected for stateless scaling.

## Risks / Trade-offs
- Connection spikes can overwhelm servers -> mitigate with rate limits and scaling.

## Migration Plan
Start with a single namespace and expand with feature-specific events.

## Open Questions
- Do we need a message broker for horizontal scaling in phase one?
