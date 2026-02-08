## Context
Firebase provides push notifications and optional auth utilities.

## Goals / Non-Goals
- Goals: Initialize Firebase and enable notification handling.
- Non-Goals: Server-side Firebase administration.

## Decisions
- Decision: Store Firebase config in a dedicated config file.
- Decision: Separate notification handlers from UI components.

## Risks / Trade-offs
- Browser notification permissions may be denied by users.

## Migration Plan
- Initialize Firebase first, then add notification handlers.

## Open Questions
- Which environments require Firebase (dev, staging, prod)?
