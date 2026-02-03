## Context
Chat provides realtime collaboration between authorized users in the dashboard.

## Goals / Non-Goals
- Goals: Conversations list, message thread, and send message flow.
- Goals: Realtime updates via Socket.IO.
- Non-Goals: Video or voice features.

## Decisions
- Decision: Use a dedicated chat route and component hierarchy.
- Decision: Use Socket.IO for realtime message delivery.
- Decision: Store unread counts per conversation in client state.

## Risks / Trade-offs
- Realtime connections require retry and reconnection handling.
- Message ordering issues can occur during reconnection.

## Migration Plan
- Implement list and thread UI first, then realtime updates.

## Open Questions
- Are typing indicators or presence required?
- Should files or attachments be supported?
