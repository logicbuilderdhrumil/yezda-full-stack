# Change: Add backend chat services

## Why
Enable realtime conversations with persistence and delivery guarantees while protecting participant data and ensuring compliance.

## What Changes
- Add conversation and message storage models.
- Add endpoints for conversation lists and message threads.
- Add message send handling with realtime broadcast.
- Enforce participant access checks and message moderation controls.
- Add audit logging and retention policies for chat access.
- Apply rate limits and SLO targets for chat delivery.

## Impact
- Affected specs: chat
- Affected code: backend chat services, websocket handlers
- Operational impact: audit logging, rate limiting, and SLO monitoring for chat services
