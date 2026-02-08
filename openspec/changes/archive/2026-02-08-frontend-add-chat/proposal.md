# Change: Add chat

## Why
Provide realtime conversations between authorized users in the dashboard.

## What Changes
- Build chat conversation list and thread views.
- Add message compose and send flows.
- Wire Socket.IO client for realtime updates.

## Impact
- Affected specs: chat
- Affected code: src/views/chat, src/socket, src/services/ChatService.ts
